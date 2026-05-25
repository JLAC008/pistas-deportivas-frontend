import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CourtService } from '../../services/court.service';
import { ReservationService } from '../../services/reservation.service';
import { Court, Reservation } from '../../models/court.model';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="payment-result-page">
      @if (success()) {
        <div class="payment-success">
          <div class="result-icon success-icon">&#10003;</div>
          <h1>Pago realizado con exito</h1>
          <p>Tu reserva ha sido confirmada y el pago procesado correctamente.</p>
          <a routerLink="/" class="btn btn-primary">Volver a pistas</a>
        </div>
      } @else {
        <div class="payment-failure">
          <div class="result-icon failure-icon">&#10007;</div>
          <h1>Pago no completado</h1>
          <p>El pago no pudo procesarse. Puedes intentarlo de nuevo.</p>
          <a routerLink="/" class="btn btn-primary">Volver a pistas</a>
        </div>
      }
    </section>
  `,
  styles: [`
    .payment-result-page { display: flex; justify-content: center; align-items: center; min-height: 60vh; }
    .payment-success, .payment-failure { text-align: center; padding: 3rem; background: var(--surface); border-radius: 16px; border: 1px solid var(--border); max-width: 480px; }
    .result-icon { font-size: 4rem; margin-bottom: 1rem; }
    .success-icon { color: #4ade80; }
    .failure-icon { color: #f87171; }
  `]
})
export class PaymentResultComponent {
  success = signal(false);

  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    this.success.set(params.get('success') === 'true');
  }
}
