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
        <h1>Reserva tu pista deportiva favorita</h1>
        <p>Facil, rapido y seguro. Tenis, futbol, padel, baloncesto y mucho mas.</p>
        <a routerLink="/courts" class="btn btn-primary btn-lg">Ver Pistas</a>
      </div>
    </section>

    <section class="features">
      <div class="section-header">
        <h2>Como funciona</h2>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">&#128269;</div>
          <h3>1. Elige tu pista</h3>
          <p>Explora nuestra variedad de pistas deportivas disponibles</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">&#128197;</div>
          <h3>2. Selecciona fecha y hora</h3>
          <p>Elige el dia y horario que mejor se adapte a ti</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">&#9989;</div>
          <h3>3. Confirma tu reserva</h3>
          <p>Reserva al instante y recibe confirmacion inmediata</p>
        </div>
      </div>
    </section>

    <section class="popular-courts">
      <div class="section-header">
        <h2>Pistas populares</h2>
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
          <span class="stat-label">Pistas disponibles</span>
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
