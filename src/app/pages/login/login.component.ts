import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Iniciar Sesion</h1>
          <p>Accede a tu cuenta para reservar pistas</p>
        </div>

        <form class="auth-form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              class="input"
              [(ngModel)]="email"
              name="email"
              placeholder="tu@email.com"
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
            <p class="demo-title">Usuarios de prueba:</p>
            <div class="demo-user">
              <p><strong>Admin:</strong> admin@sports.com / admin</p>
            </div>
            <div class="demo-user">
              <p><strong>Usuario:</strong> cualquier email / contrasena</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class LoginComponent {
  private router = inject(Router);
  private userService = inject(MockDataService);

  email = '';
  password = '';
  isLoading = signal(false);
  error = signal('');

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Por favor, completa todos los campos');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = this.userService.login(this.email, this.password);

    this.isLoading.set(false);

    if (success) {
      const returnUrl = this.router.getCurrentNavigation()?.extras.queryParams?.['returnUrl'] || '/';
      this.router.navigateByUrl(returnUrl);
    } else {
      this.error.set('Credenciales incorrectas');
    }
  }
}
