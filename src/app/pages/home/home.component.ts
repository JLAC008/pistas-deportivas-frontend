import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-location">
          <span class="hero-mushroom">&#127812;</span>
          Valle Perdido, Murcia
        </div>
        <h1>Alquila tu pista en el Valle Perdido</h1>
        <p>Reserva online pistas de tenis, futbol, padel, baloncesto y voleibol en un entorno natural a las afueras de Murcia.</p>
        <div class="hero-actions">
          <a routerLink="/courts" class="btn btn-primary btn-lg">Ver pistas</a>
          <a routerLink="/login" class="btn btn-ghost btn-lg">Gestionar reserva</a>
        </div>
        <div class="hero-meta">
          <span>Reservas 24/7</span>
          <span>Pago local u online</span>
          <span>Instalaciones iluminadas</span>
        </div>
      </div>
      <aside class="hero-rental-card" aria-label="Resumen de alquiler de pistas">
        <div class="rental-card-top">
          <span class="rental-mark">&#127812;</span>
          <div>
            <strong>Valle Perdido Sport</strong>
            <span>Centro deportivo en Murcia</span>
          </div>
        </div>
        <div class="rental-card-main">
          <span>Desde</span>
          <strong>20&#8364;/h</strong>
          <small>Reserva confirmada al instante</small>
        </div>
        <div class="rental-card-grid">
          <span>Tenis</span>
          <span>Padel</span>
          <span>Futbol</span>
          <span>Basket</span>
        </div>
      </aside>
    </section>

    <section class="features">
      <div class="section-header">
        <h2>Reserva en tres pasos</h2>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">&#128269;</div>
          <h3>1. Elige tu pista</h3>
          <p>Consulta pistas disponibles en el Valle Perdido y compara precios</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">&#128197;</div>
          <h3>2. Selecciona fecha y hora</h3>
          <p>Elige el dia y horario que mejor encaje con tu partido</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">&#9989;</div>
          <h3>3. Confirma tu reserva</h3>
          <p>Confirma tu alquiler y guarda los detalles de la reserva</p>
        </div>
      </div>
    </section>

    <section class="popular-courts">
      <div class="section-header">
        <h2>Pistas destacadas</h2>
        <a routerLink="/courts" class="btn btn-outline">Ver todas</a>
      </div>
      <div class="courts-grid">
        @for (court of userService.$courts() | slice:0:3; track court.id) {
          <div class="court-card">
            <div class="court-image">
              <img [src]="court.image" [alt]="court.name">
              <span class="court-type">{{ court.type }}</span>
            </div>
            <div class="court-info">
              <h3>{{ court.name }}</h3>
              <p class="court-description">{{ court.description }}</p>
              <div class="court-footer">
                <span class="court-price">{{ court.pricePerHour }}&#8364;/hora</span>
                <a [routerLink]="['/courts', court.id]" class="btn btn-primary btn-sm">Reservar</a>
              </div>
            </div>
          </div>
        }
      </div>
    </section>

    <section class="stats">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-number">6+</span>
          <span class="stat-label">Pistas en alquiler</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">24/7</span>
          <span class="stat-label">Reservas online</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">500+</span>
          <span class="stat-label">Clientes satisfechos</span>
        </div>
      </div>
    </section>
  `
})
export class HomeComponent {
  userService = inject(MockDataService);
}
