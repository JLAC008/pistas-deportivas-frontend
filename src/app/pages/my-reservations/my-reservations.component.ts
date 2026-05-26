import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/court.model';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-header">
      <h1>Buscar Reservas</h1>
      <p>Introduce tu email para consultar tus reservas</p>
    </section>

    <section class="email-search">
      <div class="search-box">
        <input
          type="email"
          class="input"
          [value]="searchEmail()"
          (input)="searchEmail.set($any($event.target).value)"
          placeholder="tu@email.com">
        <button class="btn btn-primary" (click)="search()" [disabled]="!searchEmail()">
          Buscar
        </button>
      </div>

      @if (error()) {
        <p class="error-message">{{ error() }}</p>
      }
    </section>

    @if (reservations().length > 0) {
      <section class="reservations-section">
        <div class="reservations-tabs">
          <button
              class="tab-btn"
              [class.active]="activeTab() === 'upcoming'"
              (click)="activeTab.set('upcoming')">
            Proximas ({{ upcomingReservations().length }})
          </button>
          <button
              class="tab-btn"
              [class.active]="activeTab() === 'past'"
              (click)="activeTab.set('past')">
            Pasadas ({{ pastReservations().length }})
          </button>
          <button
              class="tab-btn"
              [class.active]="activeTab() === 'cancelled'"
              (click)="activeTab.set('cancelled')">
            Canceladas ({{ cancelledReservations().length }})
          </button>
        </div>

        <div class="reservations-list">
          @for (res of displayedReservations(); track res.id) {
            <div class="reservation-card" [class.cancelled]="res.status === 'CANCELLED'">
              <div class="reservation-header">
                <div class="reservation-title">
                  <h3>{{ res.court.name }}</h3>
                  <span class="reservation-status" [class]="res.status">
                    {{ getStatusLabel(res.status) }}
                  </span>
                </div>
                <span class="reservation-id">#{{ res.id }}</span>
              </div>

              <div class="reservation-details">
                <div class="detail-item">
                  <span class="detail-label">Fecha:</span>
                  <span class="detail-value">{{ res.date | date:'fullDate' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Hora:</span>
                  <span class="detail-value">{{ res.startTime }}:00 - {{ res.endTime }}:00</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Duracion:</span>
                  <span class="detail-value">{{ res.endTime - res.startTime }} hora{{
                      res.endTime - res.startTime > 1 ? 's' : ''
                    }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Total:</span>
                  <span class="detail-value price">{{ res.totalPrice }}&#8364;</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Pago:</span>
                  <span class="detail-value">{{ getPaymentMethodLabel(res.paymentMethod) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Estado pago:</span>
                  <span class="detail-value">{{ getPaymentStatusLabel(res.paymentStatus) }}</span>
                </div>
              </div>

              <div class="reservation-footer">
                <span class="reservation-date">
                  Reservado el {{ res.createdAt | date:'shortDate' }}
                </span>
                @if (res.status === 'CONFIRMED') {
                  <button
                      class="btn btn-outline btn-sm"
                      (click)="cancelReservation(res.id)">
                    Cancelar
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="no-reservations">
              <p>No hay reservas en esta categoria</p>
            </div>
          }
        </div>
      </section>
    } @else if (searched()) {
      <div class="no-reservations">
        <h3>No se encontraron reservas</h3>
        <p>No hay reservas asociadas a este email</p>
        <a routerLink="/" class="btn btn-primary">Ver Pistas</a>
      </div>
    }
  `
})
export class MyReservationsComponent {
  private reservationService = inject(ReservationService);

  activeTab = signal<'upcoming' | 'past' | 'cancelled'>('upcoming');
  searchEmail = signal('');
  reservations = signal<Reservation[]>([]);
  error = signal('');
  searched = signal(false);
  loading = signal(false);

  upcomingReservations = computed(() =>
    this.reservations().filter(r =>
      r.status === 'CONFIRMED' && new Date(r.date) >= new Date()
    )
  );

  pastReservations = computed(() =>
    this.reservations().filter(r =>
      r.status === 'COMPLETED' || (r.status === 'CONFIRMED' && new Date(r.date) < new Date())
    )
  );

  cancelledReservations = computed(() =>
    this.reservations().filter(r => r.status === 'CANCELLED')
  );

  displayedReservations = computed(() => {
    const tab = this.activeTab();
    if (tab === 'upcoming') return this.upcomingReservations();
    if (tab === 'past') return this.pastReservations();
    return this.cancelledReservations();
  });

  search(): void {
    if (!this.searchEmail().trim()) return;
    this.loading.set(true);
    this.searched.set(true);
    this.error.set('');

    this.reservationService.getByEmail(this.searchEmail()).subscribe({
      next: res => {
        this.reservations.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.reservations.set([]);
        this.loading.set(false);
        this.error.set('Error al buscar reservas');
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Confirmada';
      case 'CANCELLED': return 'Cancelada';
      case 'COMPLETED': return 'Completada';
      default: return status;
    }
  }

  getPaymentMethodLabel(method: string): string {
    return method === 'ONLINE' ? 'Online' : 'En el local';
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Pagado';
      case 'PENDING': return 'Pendiente';
      case 'FAILED': return 'Fallido';
      default: return status;
    }
  }

  cancelReservation(id: string): void {
    if (confirm('Seguro que quieres cancelar esta reserva?')) {
      this.reservationService.cancel(id).subscribe({
        next: () => {
          this.reservations.set(this.reservations().filter(r => r.id !== id));
        }
      });
    }
  }
}
