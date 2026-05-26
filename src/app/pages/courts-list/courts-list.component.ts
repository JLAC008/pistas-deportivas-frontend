import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourtService } from '../../services/court.service';

const COURT_TYPE_ICONS: Record<string, string> = {
  TENIS: '🎾',
  FUTBOL: '⚽',
  PADEL: '🏓',
  BALONCESTO: '🏀',
  VOLEIBOL: '🏐',
};

@Component({
  selector: 'app-courts-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-header">
      <div class="page-header-content">
        <div class="page-kicker">
          <span>&#127812;</span>
          Valle Perdido, Murcia
        </div>
        <h1>Alquiler de pistas deportivas</h1>
        <p>Elige pista, compara precio y reserva tu horario en un centro deportivo moderno rodeado de naturaleza.</p>
        <div class="page-header-stats">
          <span><strong>{{ allCourtsCount() }}</strong> pistas</span>
          <span><strong>20&euro;</strong> desde</span>
          <span><strong>24/7</strong> online</span>
        </div>
      </div>
    </section>

    <section class="filters courts-filters">
      <div class="filter-group">
        <div class="filter-buttons">
          <button
            class="btn"
            [class.btn-primary]="selectedType() === 'all'"
            [class.btn-outline]="selectedType() !== 'all'"
            (click)="selectedType.set('all')">
            Todas
          </button>
          @for (type of courtTypes; track type) {
            <button
              class="btn"
              [class.btn-primary]="selectedType() === type"
              [class.btn-outline]="selectedType() !== type"
              (click)="selectedType.set(type)">
              {{ courtTypeIcons[type] }} {{ type | titlecase }}
            </button>
          }
        </div>
      </div>

      <div class="filter-group">
        <select class="select" [value]="sortBy()" (change)="sortBy.set($any($event.target).value)">
          <option value="name">Nombre</option>
          <option value="price-low">Precio: menor a mayor</option>
          <option value="price-high">Precio: mayor a menor</option>
        </select>
      </div>
    </section>

    <section class="courts-section">
      <div class="courts-grid">
        @for (court of filteredCourts(); track court.id) {
          <a
            class="court-card"
            [class.inactive]="!court.isActive"
            [routerLink]="court.isActive ? ['/pista', court.id] : null"
            [attr.aria-disabled]="!court.isActive || null">
            <div class="court-image">
              <img
                [src]="court.imageUrl || 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800'"
                [alt]="court.name">
              <span class="court-type">{{ courtTypeIcons[court.type] }} {{ court.type }}</span>
              @if (!court.isActive) {
                <span class="inactive-badge">Inactiva</span>
              }
            </div>
            <div class="court-info">
              <h3>{{ court.name }}</h3>
              <p class="court-description">{{ court.description }}</p>
              <div class="court-amenities">
                @for (amenity of court.amenities | slice:0:3; track amenity) {
                  <span class="amenity-tag">{{ amenity }}</span>
                }
                @if (court.amenities.length > 3) {
                  <span class="amenity-more">+{{ court.amenities.length - 3 }}</span>
                }
              </div>
              <div class="court-footer">
                <div class="court-meta">
                  <span class="court-price">{{ court.pricePerHour }}&euro;/hora</span>
                </div>
                @if (court.isActive) {
                  <span class="btn btn-primary btn-sm">Reservar</span>
                } @else {
                  <span class="btn btn-disabled btn-sm">No disponible</span>
                }
              </div>
            </div>
          </a>
        } @empty {
          <div class="no-results">
            <p>No hay pistas disponibles con los filtros seleccionados</p>
          </div>
        }
      </div>
    </section>
  `
})
export class CourtsListComponent {
  private courtService = inject(CourtService);

  selectedType = signal<string>('all');
  sortBy = signal<string>('name');

  readonly courtTypeIcons = COURT_TYPE_ICONS;
  courtTypes: string[] = ['TENIS', 'FUTBOL', 'PADEL', 'BALONCESTO', 'VOLEIBOL'];

  filteredCourts = computed(() => {
    let courts = this.courtService.courts();

    if (this.selectedType() !== 'all') {
      courts = courts.filter(c => c.type === this.selectedType());
    }

    courts = [...courts].sort((a, b) => {
      switch (this.sortBy()) {
        case 'price-low':
          return a.pricePerHour - b.pricePerHour;
        case 'price-high':
          return b.pricePerHour - a.pricePerHour;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return courts;
  });

  allCourtsCount = computed(() => this.courtService.courts().length);

  ngOnInit() {
    this.courtService.loadAll();
  }
}
