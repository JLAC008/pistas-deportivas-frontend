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
          <img src="resources/icono.webp" alt="Pistas El Valle Logo" class="logo-img" />
          <span class="logo-text">Pistas El Valle</span>
        </a>

        <div class="user-section">
          @if (authService.isLoggedIn()) {
            <div class="avatar-wrapper">
              <button
                class="avatar-btn"
                (click)="toggleAvatar($event)"
                [attr.aria-expanded]="avatarOpen()"
                aria-haspopup="true">
                <img src="resources/icono_perfil.png" alt="Admin" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" />
                <div style="display: flex; flex-direction: column;">
                  <span class="avatar-name" style="line-height: 1.2;">Admin</span>
                </div>
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
          <h4>Pistas El Valle</h4>
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
        <p>&copy; {{ currentYear }} Pistas El Valle. Todos los derechos reservados.</p>
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
