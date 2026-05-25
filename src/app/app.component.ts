import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MockDataService } from './services/mock-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="header-content">
        <a routerLink="/" class="logo">
          <span class="logo-icon">&#127936;</span>
          <span class="logo-text">SportReserve</span>
        </a>

        <nav class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Pistas</a>

          @if (userService.$currentUser()) {
            <a routerLink="/my-reservations" routerLinkActive="active">Mis Reservas</a>
            @if (userService.$currentUser()?.role === 'admin') {
              <a routerLink="/admin" routerLinkActive="active">Admin</a>
            }
          }
        </nav>

        <div class="user-section">
          @if (userService.$currentUser(); as user) {
            <div class="user-info">
              <img [src]="user.avatar || 'https://via.placeholder.com/40'" [alt]="user.name" class="user-avatar">
              <span class="user-name">{{ user.name }}</span>
              <button class="btn btn-outline btn-sm" (click)="logout()">Salir</button>
            </div>
          } @else {
            <a routerLink="/login" class="btn btn-primary">Iniciar Sesion</a>
          }
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>SportReserve</h4>
          <p>Tu plataforma de reserva de pistas deportivas</p>
        </div>
        <div class="footer-section">
          <h4>Contacto</h4>
          <p>info&#64;sportreserve.com</p>
          <p>+34 900 123 456</p>
        </div>
        <div class="footer-section">
          <h4>Horario</h4>
          <p>Lun-Dom: 8:00 - 23:00</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 SportReserve. Todos los derechos reservados.</p>
      </div>
    </footer>
  `
})
export class App {
  userService = inject(MockDataService);

  logout(): void {
    this.userService.logout();
  }
}
