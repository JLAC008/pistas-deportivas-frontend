import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CourtService } from '../../services/court.service';
import { ReservationService } from '../../services/reservation.service';
import { PaymentService } from '../../services/payment.service';
import { Court, TimeSlot } from '../../models/court.model';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';

interface SelectedBlock {
  startTime: number;
  endTime: number;
  count: number;
}

@Component({
  selector: 'app-court-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePickerComponent],
  templateUrl: './court-detail.component.html',
  styleUrls: ['./court-detail.component.css']
})
export class CourtDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly courtService = inject(CourtService);
  private readonly reservationService = inject(ReservationService);
  private readonly paymentService = inject(PaymentService);

  court = signal<Court | null>(null);
  selectedDate = signal<string>(this.getTodayString());
  selectedSlots = signal<number[]>([]);
  isBooking = signal(false);
  showSuccess = signal(false);
  customerName = signal('');
  customerPhone = signal('');
  customerEmail = signal('');
  paymentMethod = signal<'ONLINE' | 'ONSITE'>('ONLINE');
  availableSlots = signal<TimeSlot[]>([]);
  createdReservations = signal<{id: string; startTime: number; endTime: number}[]>([]);
  loadingCourt = signal(true);

  minDate = this.getTodayString();

  getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  durationHours = computed(() => {
    const court = this.court();
    if (!court) return 0;
    return court.durationMinutes / 60;
  });

  selectedBlocks = computed<SelectedBlock[]>(() => {
    const slots = this.selectedSlots();
    const court = this.court();
    if (!court || slots.length === 0) return [];

    const duration = court.durationMinutes / 60;
    const blocks: SelectedBlock[] = [];
    let blockStart = slots[0];
    let blockEnd = blockStart + duration;
    let count = 1;

    for (let i = 1; i < slots.length; i++) {
      if (slots[i] === blockEnd) {
        blockEnd = slots[i] + duration;
        count++;
      } else {
        blocks.push({ startTime: blockStart, endTime: blockEnd, count });
        blockStart = slots[i];
        blockEnd = blockStart + duration;
        count = 1;
      }
    }
    blocks.push({ startTime: blockStart, endTime: blockEnd, count });

    return blocks;
  });

  isPastSlot(time: number): boolean {
    const today = this.getTodayString();
    if (this.selectedDate() !== today) return false;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return time <= currentHour;
  }

  availableStartSlots = computed(() => {
    const slots = this.availableSlots();
    const court = this.court();
    if (!court || slots.length === 0) return [];

    const duration = court.durationMinutes / 60;

    return slots.filter(slot => {
      const start = slot.time;
      const end = start + duration;

      if (end > 23.0) return false;

      for (let t = start; t < end; t += 0.5) {
        const slotAtTime = slots.find(s => s.time === t);
        if (!slotAtTime || !slotAtTime.available) return false;
      }

      return true;
    });
  });

  totalPrice = computed(() => {
    const court = this.court();
    if (!court) return 0;
    return court.price * this.selectedSlots().length;
  });

  canBook = computed(() => {
    if (this.selectedSlots().length === 0) return false;
    if (this.paymentMethod() === 'ONSITE') return true;
    return this.isValidEmail() && this.customerName().trim().length > 0 && this.customerPhone().trim().length > 0;
  });

  ngOnInit() {
    const identifier = this.route.snapshot.paramMap.get('id');
    if (identifier) {
      this.loadingCourt.set(true);
      if (this.isUuid(identifier)) {
        this.courtService.getById(identifier).subscribe({
          next: court => {
            this.court.set(court);
            this.loadingCourt.set(false);
            this.loadAvailability();
          },
          error: () => this.loadingCourt.set(false)
        });
      } else {
        this.courtService.getAll().subscribe({
          next: courts => {
            const court = courts.find(item => this.courtSlug(item.name) === identifier);
            this.court.set(court || null);
            this.loadingCourt.set(false);
            if (court) this.loadAvailability();
          },
          error: () => this.loadingCourt.set(false)
        });
      }
    }
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    this.selectedSlots.set([]);
    this.loadAvailability();
  }

  onPhoneInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const numericValue = inputElement.value.replace(/[^0-9]/g, '');
    inputElement.value = numericValue;
    this.customerPhone.set(numericValue);
  }

  private loadAvailability(): void {
    const court = this.court();
    if (!court || !this.selectedDate()) return;
    this.courtService.getAvailability(court.id, this.selectedDate()).subscribe({
      next: res => this.availableSlots.set(res.slots)
    });
  }

  isSlotSelected(time: number): boolean {
    return this.selectedSlots().includes(time);
  }

  selectSlot(time: number): void {
    this.selectedSlots.update(slots => {
      if (slots.includes(time)) {
        return slots.filter(t => t !== time);
      }
      return [...slots, time].sort((a, b) => a - b);
    });
  }

  formatTime(time: number): string {
    const h = Math.floor(time);
    const m = Math.round((time - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  selectedTimeRange(): string {
    const blocks = this.selectedBlocks();
    if (blocks.length === 0) return 'Selecciona hora';
    if (blocks.length === 1) {
      const b = blocks[0];
      return `${this.formatTime(b.startTime)} - ${this.formatTime(b.endTime)}`;
    }
    return `${blocks.length} bloques seleccionados`;
  }

  selectedDateLabel(): string {
    const date = new Date(this.selectedDate() + 'T12:00:00');
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  hasLighting(court: Court): boolean {
    return court.amenities.some(amenity => amenity.toLowerCase().includes('ilumin'));
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private courtSlug(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.customerEmail().trim());
  }

  makeReservation(): void {
    const court = this.court();
    const blocks = this.selectedBlocks();
    if (!court || blocks.length === 0) return;

    this.isBooking.set(true);
    const isOnsite = this.paymentMethod() === 'ONSITE';

    const observables = blocks.map(block =>
      this.reservationService.create({
        courtId: court.id,
        customerName: isOnsite ? 'Presencial' : this.customerName().trim(),
        customerEmail: isOnsite ? 'presencial@valleperdidosport.com' : this.customerEmail().trim(),
        customerPhone: isOnsite ? '' : this.customerPhone().trim(),
        date: this.selectedDate(),
        startTime: block.startTime,
        endTime: block.endTime,
        paymentMethod: this.paymentMethod()
      })
    );

    forkJoin(observables).subscribe({
      next: (reservations) => {
        this.createdReservations.set(
          reservations.map(r => ({ id: r.id, startTime: r.startTime, endTime: r.endTime }))
        );
        this.isBooking.set(false);
        this.showSuccess.set(true);
      },
      error: () => {
        this.isBooking.set(false);
      }
    });
  }

  redirectToPayment(): void {
    const reservations = this.createdReservations();
    if (reservations.length === 0) return;
    this.paymentService.initiate(reservations[0].id).subscribe({
      next: (payment) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payment.url;
        form.style.display = 'none';

        const addField = (name: string, value: string) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        };

        addField('Ds_SignatureVersion', payment.dsSignatureVersion);
        addField('Ds_MerchantParameters', payment.dsMerchantParameters);
        addField('Ds_Signature', payment.dsSignature);

        document.body.appendChild(form);
        form.submit();
      }
    });
  }

  paymentMethodLabel(): string {
    return this.paymentMethod() === 'ONLINE' ? 'Pago online' : 'Pago en el local';
  }

  closeSuccess(): void {
    this.showSuccess.set(false);
    this.selectedSlots.set([]);
  }
}
