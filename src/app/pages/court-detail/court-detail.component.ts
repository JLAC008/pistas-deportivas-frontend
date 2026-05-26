import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourtService } from '../../services/court.service';
import { ReservationService } from '../../services/reservation.service';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { Court, TimeSlot } from '../../models/court.model';

@Component({
  selector: 'app-court-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (court(); as c) {
      <section class="court-detail">
        <div class="court-header">
          <a routerLink="/" class="back-link">
            <span class="back-link-icon">&#8592;</span>
            <span>
              <small>Catalogo</small>
              Volver a pistas
            </span>
          </a>
          <div class="court-image-large">
            <img [src]="c.imageUrl || 'https://via.placeholder.com/800x400?text=Sin+Imagen'" [alt]="c.name">
            <span class="court-type-badge">{{ c.type }}</span>
          </div>
          <div class="court-title-section">
            <h1>{{ c.name }}</h1>
            <p class="court-description-full">{{ c.description }}</p>
            <div class="court-quick-info">
              <span class="info-item">
                <strong>Precio:</strong> {{ c.pricePerHour }}&#8364;/hora
              </span>
              <span class="info-item">
                <strong>Jugadores:</strong> hasta {{ c.maxPlayers }}
              </span>
              <span class="info-item" [class.inactive-status]="!c.isActive">
                <strong>Estado:</strong> {{ c.isActive ? 'Disponible' : 'Inactiva' }}
              </span>
            </div>
          </div>
        </div>

        <div class="court-amenities-section">
          <h2>Instalaciones</h2>
          <div class="amenities-list">
            @for (amenity of c.amenities; track amenity) {
              <span class="amenity-badge">{{ amenity }}</span>
            }
          </div>
        </div>

        @if (c.isActive) {
          <div class="booking-section">
            <h2>Reservar</h2>

            <div class="booking-form">
              <div class="form-group">
                <label>Selecciona una fecha:</label>
                <input
                  type="date"
                  class="input"
                  [min]="minDate"
                  [value]="selectedDate()"
                  (input)="onDateChange($any($event.target).value)">
              </div>

              @if (availableSlots().length > 0) {
                <div class="form-group">
                  <label>Horarios disponibles:</label>
                  <div class="time-slots">
                    @for (slot of availableSlots(); track slot.hour) {
                      <button
                        class="time-slot"
                        [class.selected]="isSlotSelected(slot.hour)"
                        [class.available]="slot.available"
                        [disabled]="!slot.available"
                        (click)="toggleSlot(slot.hour)">
                        {{ slot.hour }}:00 - {{ slot.hour + 1 }}:00
                      </button>
                    }
                  </div>
                  @if (selectedSlots().length > 0) {
                    <p class="selection-info">
                     Seleccionado: {{ formatTime(selectedSlots()[0]) }} - {{ formatTime(selectedSlots()[selectedSlots().length - 1] + 1) }}
                      ({{ selectedSlots().length }} hora{{ selectedSlots().length > 1 ? 's' : '' }})
                    </p>
                  }
                </div>

                <div class="booking-summary">
                  <div class="summary-row">
                    <span>Horas:</span>
                    <span>{{ selectedSlots().length }}</span>
                  </div>
                  <div class="summary-row total">
                    <span>Total:</span>
                    <span>{{ totalPrice() }}&#8364;</span>
                  </div>
                </div>

                <div class="form-group">
                  <label>Forma de pago:</label>
                  <div class="payment-options">
                    <label class="payment-option" [class.selected]="paymentMethod() === 'ONSITE'">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ONSITE"
                        [checked]="paymentMethod() === 'ONSITE'"
                        (change)="paymentMethod.set('ONSITE')">
                      <span>
                        <strong>Pagar en el local</strong>
                        <small>Reserva ahora y paga al llegar</small>
                      </span>
                    </label>
                    <label class="payment-option" [class.selected]="paymentMethod() === 'ONLINE'">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ONLINE"
                        [checked]="paymentMethod() === 'ONLINE'"
                        (change)="paymentMethod.set('ONLINE')">
                      <span>
                        <strong>Pagar online</strong>
                        <small>Pago con tarjeta via Redsys</small>
                      </span>
                    </label>
                  </div>
                </div>

                <div class="guest-booking">
                  <div class="form-group">
                    <label for="guest-name">Nombre completo:</label>
                    <input
                      type="text"
                      id="guest-name"
                      class="input"
                      [value]="customerName()"
                      (input)="customerName.set($any($event.target).value)"
                      placeholder="Tu nombre"
                      required>
                  </div>
                  <div class="form-group">
                    <label for="guest-email">Email para la reserva:</label>
                    <input
                      type="email"
                      id="guest-email"
                      class="input"
                      [value]="customerEmail()"
                      (input)="customerEmail.set($any($event.target).value)"
                      placeholder="tu@email.com"
                      required>
                    @if (customerEmail().trim() && !isValidEmail()) {
                      <p class="form-error">Introduce un email valido</p>
                    }
                  </div>
                </div>

                <button
                  class="btn btn-primary btn-lg btn-block"
                  [disabled]="!canBook() || isBooking()"
                  (click)="makeReservation()">
                  @if (isBooking()) {
                    Reservando...
                  } @else {
                    Confirmar Reserva
                  }
                </button>
              } @else {
                <p class="no-slots">Selecciona una fecha para ver los horarios disponibles</p>
              }
            </div>
          </div>
        }

        @if (showSuccess()) {
          <div class="success-overlay" (click)="showSuccess.set(false)">
            <div class="success-modal" (click)="$event.stopPropagation()">
              <div class="success-icon">&#10003;</div>
              <h2>Reserva Confirmada</h2>
              <p>Tu reserva ha sido creada exitosamente</p>
              <div class="success-details">
                <p><strong>Pista:</strong> {{ c.name }}</p>
                <p><strong>Fecha:</strong> {{ selectedDate() }}</p>
                <p><strong>Hora:</strong> {{ formatTime(selectedSlots()[0]) }} - {{ formatTime(selectedSlots()[selectedSlots().length - 1] + 1) }}</p>
                <p><strong>Email:</strong> {{ customerEmail() }}</p>
                <p><strong>Pago:</strong> {{ paymentMethodLabel() }}</p>
              </div>
              @if (paymentMethod() === 'ONLINE') {
                <p class="email-confirmation-note">Redirigiendo a la pasarela de pago...</p>
                <button class="btn btn-primary" (click)="redirectToPayment()">Ir a pagar ahora</button>
              }
              <button class="btn btn-outline" routerLink="/" (click)="closeSuccess()">Volver a pistas</button>
            </div>
          </div>
        }
      </section>
    } @else {
      <div class="not-found">
        <h2>Pista no encontrada</h2>
        <a routerLink="/" class="btn btn-primary">Ver todas las pistas</a>
      </div>
    }
  `
})
export class CourtDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courtService = inject(CourtService);
  private readonly reservationService = inject(ReservationService);
  private readonly paymentService = inject(PaymentService);

  court = signal<Court | null>(null);
  selectedDate = signal<string>(this.getTodayString());
  selectedSlots = signal<number[]>([]);
  isBooking = signal(false);
  showSuccess = signal(false);
  customerName = signal('');
  customerEmail = signal('');
  paymentMethod = signal<'ONLINE' | 'ONSITE'>('ONSITE');
  availableSlots = signal<TimeSlot[]>([]);
  createdReservationId = signal<string | null>(null);
  loadingCourt = signal(true);

  minDate = this.getTodayString();

  getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  totalPrice = computed(() => {
    const court = this.court();
    if (!court) return 0;
    return court.pricePerHour * this.selectedSlots().length;
  });

  canBook = computed(() => {
    if (this.selectedSlots().length === 0) return false;
    return this.isValidEmail();
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadingCourt.set(true);
      this.courtService.getById(id).subscribe({
        next: court => {
          this.court.set(court);
          this.loadingCourt.set(false);
          this.loadAvailability();
        },
        error: () => this.loadingCourt.set(false)
      });
    }
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    this.selectedSlots.set([]);
    this.loadAvailability();
  }

  private loadAvailability(): void {
    const court = this.court();
    if (!court || !this.selectedDate()) return;
    this.courtService.getAvailability(court.id, this.selectedDate()).subscribe({
      next: res => this.availableSlots.set(res.slots)
    });
  }

  isSlotSelected(hour: number): boolean {
    return this.selectedSlots().includes(hour);
  }

  toggleSlot(hour: number): void {
    const slots = this.selectedSlots();
    const index = slots.indexOf(hour);

    if (index > -1) {
      this.selectedSlots.set(slots.filter(s => s !== hour));
    } else {
      const newSlots = [...slots, hour].sort((a, b) => a - b);
      let consecutive = true;
      for (let i = 1; i < newSlots.length; i++) {
        if (newSlots[i] - newSlots[i-1] !== 1) {
          consecutive = false;
          break;
        }
      }
      this.selectedSlots.set(consecutive ? newSlots : [hour]);
    }
  }

  formatTime(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.customerEmail().trim());
  }

  makeReservation(): void {
    const court = this.court();
    if (!court) return;

    this.isBooking.set(true);

    this.reservationService.create({
      courtId: court.id,
      customerName: this.customerName().trim(),
      customerEmail: this.customerEmail().trim(),
      date: this.selectedDate(),
      startTime: this.selectedSlots()[0],
      endTime: this.selectedSlots()[this.selectedSlots().length - 1] + 1,
      paymentMethod: this.paymentMethod()
    }).subscribe({
      next: (reservation) => {
        this.createdReservationId.set(reservation.id);
        this.isBooking.set(false);
        this.showSuccess.set(true);
      },
      error: () => {
        this.isBooking.set(false);
      }
    });
  }

  redirectToPayment(): void {
    const id = this.createdReservationId();
    if (!id) return;
    this.paymentService.initiate(id).subscribe({
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
