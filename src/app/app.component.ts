import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <header class="header">
      <div class="header-content">
        <a routerLink="/" class="logo">
          <img src="resources/icono.webp" alt="Valle Perdido Sport Logo" class="logo-img" />
          <span class="logo-text">Valle Perdido Sport</span>
        </a>

        <div class="user-section">
          @if (authService.isLoggedIn()) {
            <div class="avatar-wrapper">
              <button
                class="avatar-btn"
                (click)="toggleAvatar($event)"
                [attr.aria-expanded]="avatarOpen()"
                aria-haspopup="true">
                <span class="avatar-emoji">&#128100;</span>
                <span class="avatar-name">Admin</span>
                <span class="avatar-chevron" [class.open]="avatarOpen()">&#8964;</span>
              </button>
              @if (avatarOpen()) {
                <div class="user-dropdown">
                  <a routerLink="/admin" class="dropdown-item" (click)="avatarOpen.set(false)">
                    Panel Admin
                  </a>
                  <button class="dropdown-item danger" (click)="logout()">
                    Salir
                  </button>
                </div>
              }
            </div>
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
          <h4>Valle Perdido Sport</h4>
          <p>Alquiler de pistas deportivas en el Valle Perdido de Murcia</p>
        </div>
        <div class="footer-section">
          <h4>Contacto</h4>
          <p>info&#64;valleperdidosport.com</p>
          <p>+34 900 123 456</p>
        </div>
        <div class="footer-section">
          <h4>Horario</h4>
          <p>Lun-Dom: 8:00 - 23:00</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} Valle Perdido Sport. Todos los derechos reservados.</p>
      </div>
    </footer>
  `
})
export class App {
  authService = inject(AuthService);
  avatarOpen = signal(false);
  readonly currentYear = new Date().getFullYear();

  toggleAvatar(event: Event): void {
    event.stopPropagation();
    this.avatarOpen.update(v => !v);
  }

  @HostListener('document:click')
  closeAvatar(): void {
    this.avatarOpen.set(false);
  }

  logout(): void {
    this.avatarOpen.set(false);
    this.authService.logout();
  }
}
