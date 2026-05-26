import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {CourtService} from '../../services/court.service';
import {ReservationService} from '../../services/reservation.service';
import {Court, Reservation} from '../../models/court.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (authService.isLoggedIn()) {
      <section class="admin-panel">
        <div class="admin-header">
          <h1>Panel de Administracion</h1>
          <p>Gestiona pistas, reservas y configuracion</p>
        </div>

        <div class="admin-tabs">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'schedule'"
            (click)="switchTab('schedule')">
            Agenda
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'courts'"
            (click)="switchTab('courts')">
            Pistas
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'reservations'"
            (click)="switchTab('reservations')">
            Reservas
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'stats'"
            (click)="switchTab('stats')">
            Estadisticas
          </button>
        </div>

        <!-- Schedule Calendar -->
        @if (activeTab() === 'schedule') {
          <section class="admin-schedule">
            <div class="schedule-hero">
              <div>
                <p class="schedule-eyebrow">Agenda operativa</p>
                <h2>Calendario de pistas</h2>
                <p>Consulta ocupacion, cobros pendientes y huecos disponibles por pista sin salir del panel.</p>
              </div>
              <div class="schedule-actions">
                <button type="button" class="btn btn-outline btn-sm" (click)="clearScheduleFilters()">Hoy</button>
              </div>
            </div>

            <div class="schedule-stats">
              <article class="schedule-stat">
                <span>Ocupacion visible</span>
                <strong>{{ scheduleOccupancy() }}%</strong>
                <small>{{ scheduledReservations().length }} bloques reservados</small>
              </article>
              <article class="schedule-stat">
                <span>Pendiente de cobro</span>
                <strong>{{ pendingSchedulePayments() }}</strong>
                <small>reservas a revisar</small>
              </article>
              <article class="schedule-stat">
                <span>Pistas activas</span>
                <strong>{{ activeCourtsCount() }}</strong>
                <small>{{ calendarCourts().length }} en agenda</small>
              </article>
            </div>

            <div class="schedule-layout">
              <article class="schedule-board">
                <div class="schedule-toolbar">
                  <div class="schedule-date">
                    <label for="schedule-date">Fecha</label>
                    <input
                      id="schedule-date"
                      type="date"
                      class="input"
                      [value]="scheduleDateFilter()"
                      (input)="scheduleDateFilter.set($any($event.target).value)">
                  </div>
                  <div class="schedule-filter">
                    <label for="schedule-status">Estado</label>
                    <select
                      id="schedule-status"
                      class="select"
                      [value]="scheduleStatusFilter()"
                      (change)="scheduleStatusFilter.set($any($event.target).value)">
                      <option value="all">Todas</option>
                      <option value="CONFIRMED">Confirmadas</option>
                      <option value="COMPLETED">Completadas</option>
                      <option value="pending-payment">Pago pendiente</option>
                    </select>
                  </div>
                </div>

                <div class="schedule-calendar" aria-label="Calendario de pistas">
                  <div
                    class="schedule-grid"
                    [style.grid-template-columns]="'76px repeat(' + calendarCourts().length + ', minmax(150px, 1fr))'">
                    <div class="schedule-cell schedule-head">Hora</div>
                    @for (court of calendarCourts(); track court.id) {
                      <div class="schedule-cell schedule-head">
                        <strong>{{ court.name }}</strong>
                        <span>{{ court.type }} &middot; {{ court.pricePerHour }}&#8364;/h</span>
                      </div>
                    }

                    @for (hour of calendarHours; track hour) {
                      <div class="schedule-cell schedule-time">{{ formatHour(hour) }}</div>
                      @for (court of calendarCourts(); track court.id) {
                        <div class="schedule-cell">
                          @if (getCalendarReservation(court.id, hour); as reservation) {
                            <button
                              type="button"
                              class="schedule-booking"
                              [class.paid]="reservation.paymentStatus === 'PAID'"
                              [class.pending]="reservation.paymentStatus === 'PENDING'"
                              [class.completed]="reservation.status === 'COMPLETED'"
                              (click)="selectedReservation.set(reservation)">
                              <strong>{{ reservation.customerName }}</strong>
                              <span>{{ reservation.startTime }}:00-{{ reservation.endTime }}:00</span>
                              <small>{{ getPaymentStatusLabel(reservation.paymentStatus) }}</small>
                            </button>
                          } @else {
                            <button
                              type="button"
                              class="schedule-empty"
                              (click)="selectedEmptySlot.set(court.name + ' - ' + formatHour(hour))">
                              Libre
                            </button>
                          }
                        </div>
                      }
                    }
                  </div>
                </div>

                <div class="schedule-mobile" aria-label="Agenda movil por pista">
                  @for (court of calendarCourts(); track court.id) {
                    <section class="mobile-court-card">
                      <header>
                        <div>
                          <strong>{{ court.name }}</strong>
                          <span>{{ court.type }} &middot; {{ court.pricePerHour }}&#8364;/h</span>
                        </div>
                        <span class="mobile-court-status">Activa</span>
                      </header>
                      <div class="mobile-slot-list">
                        @for (hour of calendarHours; track hour) {
                          @if (getCalendarReservation(court.id, hour); as reservation) {
                            <button
                              type="button"
                              class="mobile-slot booked"
                              [class.paid]="reservation.paymentStatus === 'PAID'"
                              [class.pending]="reservation.paymentStatus === 'PENDING'"
                              [class.completed]="reservation.status === 'COMPLETED'"
                              (click)="selectedReservation.set(reservation)">
                              <span class="mobile-slot-time">{{ formatHour(hour) }}</span>
                              <span class="mobile-slot-main">
                                <strong>{{ reservation.customerName }}</strong>
                                <small>{{ reservation.startTime }}:00-{{ reservation.endTime }}:00 &middot; {{ getPaymentStatusLabel(reservation.paymentStatus) }}</small>
                              </span>
                            </button>
                          } @else {
                            <button
                              type="button"
                              class="mobile-slot free"
                              (click)="selectedEmptySlot.set(court.name + ' - ' + formatHour(hour)); selectedReservation.set(null)">
                              <span class="mobile-slot-time">{{ formatHour(hour) }}</span>
                              <span class="mobile-slot-main">
                                <strong>Libre</strong>
                                <small>Tocar para preparar reserva</small>
                              </span>
                            </button>
                          }
                        }
                      </div>
                    </section>
                  }
                </div>
              </article>

              <aside class="schedule-side">
                <article class="side-card">
                  <h3>Detalle seleccionado</h3>
                  @if (selectedReservation(); as reservation) {
                    <div class="detail-stack">
                      <p><span>Pista</span><strong>{{ reservation.court.name }}</strong></p>
                      <p><span>Cliente</span><strong>{{ reservation.customerName }}</strong></p>
                      <p><span>Email</span><strong>{{ reservation.customerEmail }}</strong></p>
                      <p><span>Horario</span><strong>{{ reservation.startTime }}:00-{{ reservation.endTime }}:00</strong></p>
                      <p><span>Total</span><strong>{{ reservation.totalPrice }}&#8364;</strong></p>
                    </div>
                    <div class="quick-row">
                      <select
                        class="select-sm"
                        [value]="reservation.paymentStatus"
                        (change)="updatePaymentStatus(reservation.id, $any($event.target).value)">
                        <option value="PENDING">Pendiente</option>
                        <option value="PAID">Pagado</option>
                      </select>
                      <select
                        class="select-sm"
                        [value]="reservation.status"
                        (change)="updateReservationStatus(reservation.id, $any($event.target).value)">
                        <option value="CONFIRMED">Confirmada</option>
                        <option value="COMPLETED">Completada</option>
                        <option value="CANCELLED">Cancelada</option>
                      </select>
                    </div>
                  } @else {
                    <p class="muted-copy">Selecciona una reserva para revisar datos, cobro y estado.</p>
                    @if (selectedEmptySlot(); as slot) {
                      <div class="empty-slot-note">{{ slot }} disponible</div>
                    }
                  }
                </article>

                <article class="side-card">
                  <h3>Reservas recientes</h3>
                  <div class="recent-list">
                    @for (res of recentReservations(); track res.id) {
                      <button type="button" class="recent-row" (click)="selectedReservation.set(res)">
                        <span>{{ res.startTime }}:00</span>
                        <strong>{{ res.court.name }}</strong>
                        <small [class.pending]="res.paymentStatus === 'PENDING'">{{ getPaymentStatusLabel(res.paymentStatus) }}</small>
                      </button>
                    }
                  </div>
                </article>
              </aside>
            </div>
          </section>
        }

        <!-- Courts Management -->
        @if (activeTab() === 'courts') {
          <section class="admin-section">
            <div class="section-actions">
              <h2>Gestion de Pistas</h2>
              <button class="btn btn-primary" (click)="showAddCourtModal.set(true)">
                + Nueva Pista
              </button>
            </div>

            <div class="courts-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Precio/hora</th>
                    <th>Jugadores</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (court of courtService.courts(); track court.id) {
                    <tr>
                      <td>
                        <img [src]="court.imageUrl || 'https://via.placeholder.com/80'" [alt]="court.name" class="table-image">
                      </td>
                      <td>{{ court.name }}</td>
                      <td>
                        <span class="type-badge">{{ court.type }}</span>
                      </td>
                      <td>{{ court.pricePerHour }}&#8364;</td>
                      <td>{{ court.maxPlayers }}</td>
                      <td>
                        <span class="status-badge" [class.active]="court.isActive" [class.inactive]="!court.isActive">
                          {{ court.isActive ? 'Activa' : 'Inactiva' }}
                        </span>
                      </td>
                      <td class="actions-cell">
                        <button class="btn btn-sm btn-outline" (click)="editCourt(court)">Editar</button>
                        <button
                          class="btn btn-sm"
                          [class.btn-success]="!court.isActive"
                          [class.btn-warning]="court.isActive"
                          (click)="toggleCourtStatus(court.id)">
                          {{ court.isActive ? 'Desactivar' : 'Activar' }}
                        </button>
                        <button class="btn btn-sm btn-danger" (click)="deleteCourt(court)">Eliminar</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="admin-mobile-list" aria-label="Pistas en formato movil">
              @for (court of courtService.courts(); track court.id) {
                <article class="admin-mobile-card">
                  <div class="admin-mobile-card-top">
                    <img [src]="court.imageUrl || 'https://via.placeholder.com/80'" [alt]="court.name" class="admin-mobile-thumb">
                    <div class="admin-mobile-main">
                      <div class="admin-mobile-title-row">
                        <h3>{{ court.name }}</h3>
                        <span class="status-badge" [class.active]="court.isActive" [class.inactive]="!court.isActive">
                          {{ court.isActive ? 'Activa' : 'Inactiva' }}
                        </span>
                      </div>
                      <div class="admin-mobile-meta">
                        <span class="type-badge">{{ court.type }}</span>
                        <span>{{ court.pricePerHour }}&#8364;/hora</span>
                        <span>{{ court.maxPlayers }} jugadores</span>
                      </div>
                    </div>
                  </div>
                  <div class="admin-mobile-actions">
                    <button class="btn btn-sm btn-outline" (click)="editCourt(court)">Editar</button>
                    <button
                      class="btn btn-sm"
                      [class.btn-success]="!court.isActive"
                      [class.btn-warning]="court.isActive"
                      (click)="toggleCourtStatus(court.id)">
                      {{ court.isActive ? 'Desactivar' : 'Activar' }}
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="deleteCourt(court)">Eliminar</button>
                  </div>
                </article>
              }
            </div>
          </section>
        }

        <!-- Reservations Management -->
        @if (activeTab() === 'reservations') {
          <section class="admin-section">
            <div class="section-actions">
              <h2>Gestion de Reservas</h2>
              <div class="filters-inline">
                <select class="select" [value]="reservationFilter()" (change)="reservationFilter.set($any($event.target).value)">
                  <option value="all">Todos los estados</option>
                  <option value="CONFIRMED">Confirmadas</option>
                  <option value="COMPLETED">Completadas</option>
                  <option value="CANCELLED">Canceladas</option>
                </select>
                <input
                  type="date"
                  class="input"
                  [value]="reservationDateFilter()"
                  (input)="reservationDateFilter.set($any($event.target).value)"
                  aria-label="Filtrar por fecha">
                <select class="select" [value]="reservationHourFilter()" (change)="reservationHourFilter.set($any($event.target).value)">
                  <option value="all">Todas las horas</option>
                  @for (hour of reservationHours; track hour) {
                    <option [value]="hour">{{ hour }}:00</option>
                  }
                </select>
                <select class="select" [value]="reservationSort()" (change)="reservationSort.set($any($event.target).value)">
                  <option value="created-desc">Mas recientes primero</option>
                  <option value="date-asc">Fecha mas proxima</option>
                  <option value="date-desc">Fecha mas lejana</option>
                </select>
                <button type="button" class="btn btn-outline btn-sm" (click)="clearReservationFilters()">
                  Limpiar
                </button>
              </div>
            </div>

            <div class="reservations-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Pista</th>
                    <th>Cliente</th>
                    <th>Email</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (res of filteredReservations(); track res.id) {
                    <tr>
                      <td>#{{ res.id }}</td>
                      <td>{{ res.court.name }}</td>
                      <td>{{ res.customerName }}</td>
                      <td>{{ res.customerEmail }}</td>
                      <td>{{ res.date | date:'shortDate' }}</td>
                      <td>{{ res.startTime }}:00-{{ res.endTime }}:00</td>
                      <td>{{ res.totalPrice }}&#8364;</td>
                      <td>
                        <select
                          class="select-sm"
                          [class.payment-paid]="res.paymentStatus === 'PAID'"
                          [class.payment-pending]="res.paymentStatus === 'PENDING'"
                          [value]="res.paymentStatus"
                          (change)="updatePaymentStatus(res.id, $any($event.target).value)">
                          <option value="PENDING">Pendiente</option>
                          <option value="PAID">Pagado</option>
                        </select>
                        <div class="payment-method-label">{{ getPaymentMethodLabel(res.paymentMethod) }}</div>
                      </td>
                      <td>
                        <span class="status-badge" [class]="res.status">
                          {{ getStatusLabel(res.status) }}
                        </span>
                      </td>
                      <td class="actions-cell">
                        <select
                          class="select-sm"
                          [value]="res.status"
                          (change)="updateReservationStatus(res.id, $any($event.target).value)">
                          <option value="CONFIRMED">Confirmada</option>
                          <option value="COMPLETED">Completada</option>
                          <option value="CANCELLED">Cancelada</option>
                        </select>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="admin-mobile-list" aria-label="Reservas en formato movil">
              @for (res of filteredReservations(); track res.id) {
                <article class="admin-mobile-card reservation-admin-card">
                  <div class="admin-mobile-title-row">
                    <div>
                      <h3>{{ res.court.name }}</h3>
                      <p class="admin-mobile-subtitle">
                        {{ res.date | date:'shortDate' }} &middot; {{ res.startTime }}:00-{{ res.endTime }}:00
                      </p>
                    </div>
                    <span class="status-badge" [class]="res.status">
                      {{ getStatusLabel(res.status) }}
                    </span>
                  </div>

                  <div class="admin-mobile-detail-grid">
                    <p><span>Cliente</span><strong>{{ res.customerName }}</strong></p>
                    <p><span>Email</span><strong>{{ res.customerEmail }}</strong></p>
                    <p><span>Total</span><strong>{{ res.totalPrice }}&#8364;</strong></p>
                    <p><span>Pago</span><strong>{{ getPaymentStatusLabel(res.paymentStatus) }} &middot; {{ getPaymentMethodLabel(res.paymentMethod) }}</strong></p>
                  </div>

                  <div class="admin-mobile-controls">
                    <label>
                      Pago
                      <select
                        class="select-sm"
                        [class.payment-paid]="res.paymentStatus === 'PAID'"
                        [class.payment-pending]="res.paymentStatus === 'PENDING'"
                        [value]="res.paymentStatus"
                        (change)="updatePaymentStatus(res.id, $any($event.target).value)">
                        <option value="PENDING">Pendiente</option>
                        <option value="PAID">Pagado</option>
                      </select>
                    </label>
                    <label>
                      Estado
                      <select
                        class="select-sm"
                        [value]="res.status"
                        (change)="updateReservationStatus(res.id, $any($event.target).value)">
                        <option value="CONFIRMED">Confirmada</option>
                        <option value="COMPLETED">Completada</option>
                        <option value="CANCELLED">Cancelada</option>
                      </select>
                    </label>
                  </div>
                </article>
              } @empty {
                <div class="admin-mobile-empty">No hay reservas con estos filtros.</div>
              }
            </div>
          </section>
        }

        <!-- Statistics -->
        @if (activeTab() === 'stats') {
          <section class="admin-section">
            <h2>Estadisticas</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <h3>Pistas Activas</h3>
                <span class="stat-value">{{ activeCourtsCount() }}</span>
              </div>
              <div class="stat-card">
                <h3>Reservas Totales</h3>
                <span class="stat-value">{{ reservationService.reservations().length }}</span>
              </div>
              <div class="stat-card">
                <h3>Reservas Confirmadas</h3>
                <span class="stat-value">{{ confirmedReservations() }}</span>
              </div>
              <div class="stat-card">
                <h3>Ingresos Totales</h3>
                <span class="stat-value">{{ totalRevenue() }}&#8364;</span>
              </div>
              <div class="stat-card">
                <h3>Pista mas reservada</h3>
                <span class="stat-value text">{{ mostPopularCourt() }}</span>
              </div>
              <div class="stat-card">
                <h3>Hora mas popular</h3>
                <span class="stat-value">{{ mostPopularHour() }}:00</span>
              </div>
            </div>

            <h3>Reservas por tipo de pista</h3>
            <div class="chart-bars">
              @for (item of reservationsByType(); track item.type) {
                <div class="chart-bar-item">
                  <span class="bar-label">{{ item.type }}</span>
                  <div class="bar-container">
                    <div class="bar-fill" [style.width.%]="item.percentage"></div>
                  </div>
                  <span class="bar-value">{{ item.count }}</span>
                </div>
              }
            </div>
          </section>
        }

        <!-- Add/Edit Court Modal -->
        @if (showAddCourtModal() || editingCourt()) {
          <div class="modal-overlay" (click)="closeModal()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h2>{{ editingCourt() ? 'Editar Pista' : 'Nueva Pista' }}</h2>
                <button class="modal-close" (click)="closeModal()">&times;</button>
              </div>
              <form class="modal-form" (ngSubmit)="saveCourt()">
                <div class="form-row">
                  <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" class="input" [(ngModel)]="courtForm.name" name="name" required>
                  </div>
                  <div class="form-group">
                    <label>Tipo</label>
                    <select class="select" [(ngModel)]="courtForm.type" name="type" required>
                      <option value="TENIS">Tenis</option>
                      <option value="FUTBOL">Futbol</option>
                      <option value="PADEL">Padel</option>
                      <option value="BALONCESTO">Baloncesto</option>
                      <option value="VOLEIBOL">Voleibol</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>Descripcion</label>
                  <textarea class="textarea" [(ngModel)]="courtForm.description" name="description" rows="3"></textarea>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Precio por hora (&#8364;)</label>
                    <input type="number" class="input" [(ngModel)]="courtForm.pricePerHour" name="price" required min="1">
                  </div>
                  <div class="form-group">
                    <label>Max. Jugadores</label>
                    <input type="number" class="input" [(ngModel)]="courtForm.maxPlayers" name="players" required min="1">
                  </div>
                </div>

                <div class="form-group">
                  <label>Imagen</label>
                  @if (courtForm.imageUrl) {
                    <div class="image-preview-wrapper">
                      <img [src]="courtForm.imageUrl" alt="Preview" class="image-preview">
                      <button type="button" class="btn btn-sm btn-outline remove-image-btn" (click)="removeImage()">Quitar imagen</button>
                    </div>
                  }
                  <div class="upload-row">
                    <input type="file" accept="image/*" class="input-file" (change)="onFileSelected($event)" #fileInput>
                    @if (isUploading()) {
                      <span class="upload-spinner">Subiendo...</span>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label>Instalaciones (separadas por coma)</label>
                  <input type="text" class="input" [(ngModel)]="courtForm.amenitiesInput" name="amenities" placeholder="Iluminacion, Vestuarios, Duchas">
                </div>

                <div class="form-group checkbox-group">
                  <label>
                    <input type="checkbox" [(ngModel)]="courtForm.isActive" name="isActive">
                    Pista activa
                  </label>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
                  <button type="submit" class="btn btn-primary">{{ editingCourt() ? 'Guardar' : 'Crear' }}</button>
                </div>
              </form>
            </div>
          </div>
        }
      </section>
    } @else {
      <div class="access-denied">
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta seccion</p>
        <a routerLink="/login" class="btn btn-primary">Iniciar Sesion</a>
      </div>
    }
  `
})
class AdminComponent {
  authService = inject(AuthService);
  courtService = inject(CourtService);
  reservationService = inject(ReservationService);

  activeTab = signal<'schedule' | 'courts' | 'reservations' | 'stats'>('schedule');
  showAddCourtModal = signal(false);
  editingCourt = signal<Court | null>(null);
  isUploading = signal(false);
  reservationFilter = signal<string>('all');
  reservationDateFilter = signal('');
  reservationHourFilter = signal<string>('all');
  reservationSort = signal<'created-desc' | 'date-asc' | 'date-desc'>('created-desc');
  scheduleDateFilter = signal(this.toDateInputValue(new Date()));
  scheduleStatusFilter = signal<string>('all');
  selectedReservation = signal<Reservation | null>(null);
  selectedEmptySlot = signal('');
  reservationHours = Array.from({ length: 15 }, (_, index) => index + 8);
  calendarHours = Array.from({ length: 15 }, (_, index) => index + 8);

  courtForm = {
    name: '',
    type: 'TENIS' as string,
    description: '',
    pricePerHour: 20,
    maxPlayers: 4,
    imageUrl: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
    amenitiesInput: '',
    isActive: true
  };

  ngOnInit() {
    this.courtService.loadAdminAll();
    this.reservationService.loadAll();
  }

  switchTab(tab: 'schedule' | 'courts' | 'reservations' | 'stats'): void {
    this.activeTab.set(tab);
    if (tab === 'courts') this.courtService.loadAdminAll();
    if (tab === 'reservations' || tab === 'schedule' || tab === 'stats') this.reservationService.loadAll();
  }

  activeCourtsCount = computed(() =>
    this.courtService.courts().filter(c => c.isActive).length
  );

  confirmedReservations = computed(() =>
    this.reservationService.reservations().filter(r => r.status === 'CONFIRMED').length
  );

  totalRevenue = computed(() =>
    this.reservationService.reservations()
      .filter(r => r.status !== 'CANCELLED')
      .reduce((sum, r) => sum + r.totalPrice, 0)
  );

  mostPopularCourt = computed(() => {
    const courts = new Map<string, number>();
    this.reservationService.reservations()
      .filter(r => r.status !== 'CANCELLED')
      .forEach(r => courts.set(r.court.name, (courts.get(r.court.name) || 0) + 1));
    const sorted = [...courts.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'N/A';
  });

  mostPopularHour = computed(() => {
    const hours = new Map<number, number>();
    this.reservationService.reservations()
      .filter(r => r.status !== 'CANCELLED')
      .forEach(r => {
        for (let h = r.startTime; h < r.endTime; h++) {
          hours.set(h, (hours.get(h) || 0) + 1);
        }
      });
    const sorted = [...hours.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 0;
  });

  filteredReservations = computed(() => {
    const filter = this.reservationFilter();
    const dateFilter = this.reservationDateFilter();
    const hourFilter = this.reservationHourFilter();
    const sort = this.reservationSort();
    let res = this.reservationService.reservations();

    if (filter !== 'all') {
      res = res.filter(r => r.status === filter);
    }

    if (dateFilter) {
      res = res.filter(r => r.date === dateFilter);
    }

    if (hourFilter !== 'all') {
      const hour = Number(hourFilter);
      res = res.filter(r => hour >= r.startTime && hour < r.endTime);
    }

    return [...res].sort((a, b) => {
      if (sort === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sort === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  calendarCourts = computed(() =>
    this.courtService.courts().filter(court => court.isActive).slice(0, 5)
  );

  scheduledReservations = computed(() => {
    const dateFilter = this.scheduleDateFilter();
    const statusFilter = this.scheduleStatusFilter();
    const courtIds = new Set(this.calendarCourts().map(court => court.id));

    return this.reservationService.reservations().filter(reservation => {
      const matchesCourt = courtIds.has(reservation.court.id);
      const matchesDate = reservation.date === dateFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        reservation.status === statusFilter ||
        (statusFilter === 'pending-payment' && reservation.paymentStatus === 'PENDING');

      return matchesCourt && matchesDate && matchesStatus && reservation.status !== 'CANCELLED';
    });
  });

  scheduleOccupancy = computed(() => {
    const totalSlots = this.calendarCourts().length * this.calendarHours.length;
    if (!totalSlots) return 0;
    const bookedSlots = this.scheduledReservations().reduce(
      (sum, reservation) => sum + Math.max(1, reservation.endTime - reservation.startTime),
      0
    );
    return Math.min(100, Math.round((bookedSlots / totalSlots) * 100));
  });

  pendingSchedulePayments = computed(() =>
    this.scheduledReservations().filter(reservation => reservation.paymentStatus === 'PENDING').length
  );

  recentReservations = computed(() =>
    [...this.reservationService.reservations()]
      .filter(reservation => reservation.status !== 'CANCELLED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  getCalendarReservation(courtId: string, hour: number): Reservation | null {
    return this.scheduledReservations().find(reservation =>
      reservation.court.id === courtId &&
      hour >= reservation.startTime &&
      hour < reservation.endTime
    ) || null;
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  clearScheduleFilters(): void {
    this.scheduleDateFilter.set(this.toDateInputValue(new Date()));
    this.scheduleStatusFilter.set('all');
    this.selectedReservation.set(null);
    this.selectedEmptySlot.set('');
  }

  clearReservationFilters(): void {
    this.reservationFilter.set('all');
    this.reservationDateFilter.set('');
    this.reservationHourFilter.set('all');
    this.reservationSort.set('created-desc');
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  reservationsByType = computed(() => {
    const typeCount = new Map<string, number>();
    const courts = this.courtService.courts();

    courts.forEach(c => typeCount.set(c.type, 0));

    this.reservationService.reservations()
      .filter(r => r.status !== 'CANCELLED')
      .forEach(r => {
        typeCount.set(r.court.type, (typeCount.get(r.court.type) || 0) + 1);
      });

    const total = [...typeCount.values()].reduce((sum, v) => sum + v, 0);
    const result: { type: string; count: number; percentage: number }[] = [];

    typeCount.forEach((count, type) => {
      result.push({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      });
    });

    return result.sort((a, b) => b.count - a.count);
  });

  editCourt(court: Court): void {
    this.editingCourt.set(court);
    this.courtForm = {
      name: court.name,
      type: court.type,
      description: court.description || '',
      pricePerHour: court.pricePerHour,
      maxPlayers: court.maxPlayers,
      imageUrl: court.imageUrl || '',
      amenitiesInput: court.amenities.join(', '),
      isActive: court.isActive
    };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;

    this.isUploading.set(true);
    this.courtService.uploadImage(file).subscribe({
      next: (res) => {
        this.courtForm.imageUrl = res.url;
        this.isUploading.set(false);
      },
      error: () => {
        this.isUploading.set(false);
      }
    });
  }

  removeImage(): void {
    this.courtForm.imageUrl = '';
  }

  closeModal(): void {
    this.showAddCourtModal.set(false);
    this.editingCourt.set(null);
    this.resetForm();
  }

  resetForm(): void {
    this.courtForm = {
      name: '',
      type: 'TENIS',
      description: '',
      pricePerHour: 20,
      maxPlayers: 4,
      imageUrl: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
      amenitiesInput: '',
      isActive: true
    };
  }

  saveCourt(): void {
    const amenities = this.courtForm.amenitiesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const courtData = {
      name: this.courtForm.name,
      type: this.courtForm.type,
      description: this.courtForm.description,
      pricePerHour: this.courtForm.pricePerHour,
      maxPlayers: this.courtForm.maxPlayers,
      imageUrl: this.courtForm.imageUrl,
      amenities
    };

    const editing = this.editingCourt();
    const request = editing
      ? this.courtService.update(editing.id, courtData)
      : this.courtService.create(courtData);

    request.subscribe({
      next: () => {
        this.courtService.loadAdminAll();
        this.closeModal();
      }
    });
  }

  toggleCourtStatus(id: string): void {
    this.courtService.toggle(id).subscribe({
      next: () => this.courtService.loadAdminAll()
    });
  }

  deleteCourt(court: Court): void {
    if (confirm(`Seguro que quieres eliminar "${court.name}"?`)) {
      this.courtService.delete(court.id).subscribe({
        next: () => this.courtService.loadAdminAll(),
        error: () => alert('No se puede eliminar: tiene reservas activas')
      });
    }
  }

  updateReservationStatus(id: string, status: string): void {
    this.reservationService.updateStatus(id, status).subscribe({
      next: () => this.reservationService.loadAll()
    });
  }

  updatePaymentStatus(id: string, paymentStatus: string): void {
    this.reservationService.updatePaymentStatus(id, paymentStatus).subscribe({
      next: () => {
        this.selectedReservation.set(null);
        this.reservationService.loadAll();
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
    return method === 'ONLINE' ? 'Online' : 'Local';
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Pagado';
      case 'PENDING': return 'Pendiente';
      case 'FAILED': return 'Fallido';
      default: return status;
    }
  }
}

export default AdminComponent
