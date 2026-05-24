import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MockDataService } from '../../services/mock-data.service';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-court-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (court(); as c) {
      <section class="court-detail">
        <div class="court-header">
          <a routerLink="/courts" class="back-link">&larr; Volver a pistas</a>
          <div class="court-image-large">
            <img [src]="c.image" [alt]="c.name">
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
                  (input)="selectedDate.set($any($event.target).value)">
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
                    <label class="payment-option" [class.selected]="paymentMethod() === 'onsite'">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="onsite"
                        [checked]="paymentMethod() === 'onsite'"
                        (change)="paymentMethod.set('onsite')">
                      <span>
                        <strong>Pagar en el local</strong>
                        <small>Reserva ahora y paga al llegar</small>
                      </span>
                    </label>
                    <label class="payment-option" [class.selected]="paymentMethod() === 'online'">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        [checked]="paymentMethod() === 'online'"
                        (change)="paymentMethod.set('online')">
                      <span>
                        <strong>Pagar online</strong>
                        <small>Pago simulado en esta demo</small>
                      </span>
                    </label>
                  </div>
                </div>

                @if (userService.$currentUser(); as user) {
                  <div class="booking-contact">
                    <p class="contact-label">Reserva como</p>
                    <p class="contact-value">{{ user.name }} · {{ user.email }}</p>
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
                  <div class="guest-booking">
                    <div class="form-group">
                      <label for="guest-email">Email para la reserva:</label>
                      <input
                        type="email"
                        id="guest-email"
                        class="input"
                        [value]="guestEmail()"
                        (input)="guestEmail.set($any($event.target).value)"
                        placeholder="tu@email.com"
                        required>
                      @if (guestEmail().trim() && !isValidGuestEmail()) {
                        <p class="form-error">Introduce un email valido</p>
                      }
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
                    <p class="guest-note">Tambien puedes <a routerLink="/login">iniciar sesion</a> para guardar la reserva en tu cuenta.</p>
                  </div>
                }
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
                <p><strong>Fecha:</strong> {{ selectedDate() | date:'fullDate' }}</p>
                <p><strong>Hora:</strong> {{ formatTime(selectedSlots()[0]) }} - {{ formatTime(selectedSlots()[selectedSlots().length - 1] + 1) }}</p>
                <p><strong>Email:</strong> {{ reservationEmail() }}</p>
                <p><strong>Pago:</strong> {{ paymentMethodLabel() }} - {{ paymentStatusLabel() }}</p>
              </div>
              <p class="email-confirmation-note">{{ emailStatusMessage() }}</p>
              @if (userService.$currentUser()) {
                <button class="btn btn-primary" (click)="goToReservations()">Ver mis reservas</button>
              } @else {
                <button class="btn btn-primary" routerLink="/courts" (click)="closeSuccess()">Volver a pistas</button>
              }
              <button class="btn btn-outline" (click)="closeSuccess()">Cerrar</button>
            </div>
          </div>
        }
      </section>
    } @else {
      <div class="not-found">
        <h2>Pista no encontrada</h2>
        <a routerLink="/courts" class="btn btn-primary">Ver todas las pistas</a>
      </div>
    }
  `
})
export class CourtDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private emailService = inject(EmailService);
  userService = inject(MockDataService);

  court = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.userService.getCourtById(id) : undefined;
  });

  selectedDate = signal<string>(this.getTodayString());
  selectedSlots = signal<number[]>([]);
  isBooking = signal(false);
  showSuccess = signal(false);
  guestEmail = signal('');
  reservationEmail = signal('');
  emailStatusMessage = signal('');
  paymentMethod = signal<'online' | 'onsite'>('onsite');
  confirmedPaymentMethod = signal<'online' | 'onsite'>('onsite');
  confirmedPaymentStatus = signal<'paid' | 'pending'>('pending');

  minDate = this.getTodayString();

  private static getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  availableSlots = computed(() => {
    const court = this.court();
    const dateStr = this.selectedDate();
    if (!court || !dateStr) return [];

    const date = new Date(dateStr);
    return this.userService.getAvailableSlots(court.id, date);
  });

  totalPrice = computed(() => {
    const court = this.court();
    if (!court) return 0;
    return court.pricePerHour * this.selectedSlots().length;
  });

  canBook = computed(() => {
    if (this.selectedSlots().length === 0) return false;
    return this.userService.$currentUser() ? true : this.isValidGuestEmail();
  });

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
      // Check if slots are consecutive
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

  isValidGuestEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.guestEmail().trim());
  }

  async makeReservation(): Promise<void> {
    const court = this.court();
    const user = this.userService.$currentUser();
    if (!court || !this.canBook()) return;

    const guestEmail = this.guestEmail().trim();
    const reservationUser = user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          isGuest: false
        }
      : {
          id: `guest:${guestEmail.toLowerCase()}`,
          name: 'Invitado',
          email: guestEmail,
          isGuest: true
        };

    this.isBooking.set(true);

    // Simulate API/payment delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const selectedPaymentMethod = this.paymentMethod();
    const paymentStatus = selectedPaymentMethod === 'online' ? 'paid' : 'pending';

    const reservation = this.userService.createReservation(
      court.id,
      new Date(this.selectedDate()),
      this.selectedSlots()[0],
      this.selectedSlots()[this.selectedSlots().length - 1] + 1,
      reservationUser.id,
      reservationUser.name,
      reservationUser.email,
      reservationUser.isGuest,
      selectedPaymentMethod,
      paymentStatus
    );

    this.isBooking.set(false);

    if (reservation) {
      this.sendReservationEmails(reservation);
      this.reservationEmail.set(reservation.userEmail);
      this.confirmedPaymentMethod.set(reservation.paymentMethod);
      this.confirmedPaymentStatus.set(reservation.paymentStatus);
      this.showSuccess.set(true);
    }
  }

  paymentMethodLabel(): string {
    return this.confirmedPaymentMethod() === 'online' ? 'Pagado online' : 'Pago en el local';
  }

  paymentStatusLabel(): string {
    return this.confirmedPaymentStatus() === 'paid' ? 'Pagado' : 'Pendiente';
  }

  private sendReservationEmails(reservation: NonNullable<ReturnType<MockDataService['createReservation']>>): void {
    try {
      this.emailService.sendReservationConfirmation(reservation);
      this.emailStatusMessage.set(`Confirmacion preparada para ${reservation.userEmail}`);
    } catch (error) {
      console.error('No se pudo preparar el email simulado', error);
      this.emailStatusMessage.set('Reserva creada. No se pudo preparar la confirmacion por email.');
    }
  }

  goToReservations(): void {
    this.router.navigate(['/my-reservations']);
  }

  closeSuccess(): void {
    this.showSuccess.set(false);
    this.selectedSlots.set([]);
  }
}
