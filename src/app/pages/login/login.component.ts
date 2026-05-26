import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Iniciar Sesion</h1>
          <p>Accede al panel de administracion</p>
        </div>

        <form class="auth-form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input
              type="text"
              id="username"
              class="input"
              [(ngModel)]="username"
              name="username"
              placeholder="admin"
              required>
          </div>

          <div class="form-group">
            <label for="password">Contrasena</label>
            <input
              type="password"
              id="password"
              class="input"
              [(ngModel)]="password"
              name="password"
              placeholder="Tu contrasena"
              required>
          </div>

          @if (error()) {
            <div class="error-message">
              {{ error() }}
            </div>
          }

          <button type="submit" class="btn btn-primary btn-lg btn-block" [disabled]="isLoading()">
            @if (isLoading()) {
              Iniciando sesion...
            } @else {
              Iniciar Sesion
            }
          </button>
        </form>

        <div class="auth-footer">
          <div class="demo-credentials">
            <p class="demo-title">Credenciales de prueba:</p>
            <div class="demo-user">
              <p><strong>Admin:</strong> admin / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  username = '';
  password = '';
  isLoading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.error.set('Por favor, completa todos los campos');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'] || '/admin';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Credenciales incorrectas');
      }
    });
  }
}
