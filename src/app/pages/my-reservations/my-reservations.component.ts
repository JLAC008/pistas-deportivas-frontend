import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-header">
      <h1>Mis Reservas</h1>
      <p>Historial de tus reservas de pistas</p>
    </section>

    @if (user(); ) {
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
              <div class="reservation-card" [class.cancelled]="res.status === 'cancelled'">
                <div class="reservation-header">
                  <div class="reservation-title">
                    <h3>{{ res.courtName }}</h3>
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
                  @if (res.status === 'confirmed') {
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
      } @else {
        <div class="no-reservations">
          <h3>No tienes reservas aun</h3>
          <p>Explora nuestras pistas y haz tu primera reserva</p>
          <a routerLink="/" class="btn btn-primary">Ver Pistas</a>
        </div>
      }
    } @else {
      <div class="login-prompt-center">
        <h3>Inicia sesion para ver tus reservas</h3>
        <a routerLink="/login" class="btn btn-primary">Iniciar Sesion</a>
      </div>
    }
  `
})
export class MyReservationsComponent {
  userService = inject(MockDataService);

  activeTab = signal<'upcoming' | 'past' | 'cancelled'>('upcoming');

  user = computed(() => this.userService.$currentUser());

  reservations = computed(() => {
    const u = this.user();
    if (!u) return [];
    return this.userService.getUserReservations(u.id);
  });

  upcomingReservations = computed(() =>
    this.reservations().filter(r =>
      r.status === 'confirmed' && new Date(r.date) >= new Date()
    )
  );

  pastReservations = computed(() =>
    this.reservations().filter(r =>
      r.status === 'completed' || (r.status === 'confirmed' && new Date(r.date) < new Date())
    )
  );

  cancelledReservations = computed(() =>
    this.reservations().filter(r => r.status === 'cancelled')
  );

  displayedReservations = computed(() => {
    const tab = this.activeTab();
    if (tab === 'upcoming') return this.upcomingReservations();
    if (tab === 'past') return this.pastReservations();
    return this.cancelledReservations();
  });

  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  }

  getPaymentMethodLabel(method: string): string {
    return method === 'online' ? 'Online' : 'En el local';
  }

  getPaymentStatusLabel(status: string): string {
    return status === 'paid' ? 'Pagado' : 'Pendiente';
  }

  cancelReservation(id: string): void {
    if (confirm('Seguro que quieres cancelar esta reserva?')) {
      this.userService.cancelReservation(id);
    }
  }
}
