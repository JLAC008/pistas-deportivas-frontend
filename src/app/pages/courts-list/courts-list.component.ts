import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../services/mock-data.service';
import { Court } from '../../models/court.model';

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
          <span><strong>{{ userService.$courts().length }}</strong> pistas</span>
          <span><strong>20&#8364;</strong> desde</span>
          <span><strong>24/7</strong> online</span>
        </div>
      </div>
    </section>

    <section class="filters courts-filters">
      <div class="filter-group">
        <label>Tipo de pista:</label>
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
              {{ type | titlecase }}
            </button>
          }
        </div>
      </div>

      <div class="filter-group">
        <label>Ordenar por:</label>
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
          <div class="court-card" [class.inactive]="!court.isActive">
            <div class="court-image">
              <img [src]="court.image" [alt]="court.name">
              <span class="court-type">{{ court.type }}</span>
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
                  <span class="court-price">{{ court.pricePerHour }}&#8364;/hora</span>
                  <span class="court-players">&#128101; {{ court.maxPlayers }}</span>
                </div>
                @if (court.isActive) {
                  <a [routerLink]="['/courts', court.id]" class="btn btn-primary btn-sm">Reservar</a>
                } @else {
                  <span class="btn btn-disabled btn-sm">No disponible</span>
                }
              </div>
            </div>
          </div>
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
  userService = inject(MockDataService);

  selectedType = signal<string>('all');
  sortBy = signal<string>('name');

  courtTypes: string[] = ['tenis', 'futbol', 'padel', 'baloncesto', 'voleibol'];

  filteredCourts = computed(() => {
    let courts = this.userService.$courts();

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
}
