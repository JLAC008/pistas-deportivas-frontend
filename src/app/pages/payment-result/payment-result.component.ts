import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.css']
})
export class PaymentResultComponent implements OnInit {
  success = signal(false);
  loading = signal(true);
  error = signal(false);

  constructor(private readonly paymentService: PaymentService) {}

  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    const merchantParameters = params.get('Ds_MerchantParameters');
    const signature = params.get('Ds_Signature');

    if (merchantParameters && signature) {
      this.paymentService.confirm({ dsMerchantParameters: merchantParameters, dsSignature: signature }).subscribe({
        next: (res) => {
          this.success.set(res.success);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
    } else {
      const successParam = params.get('success');
      this.success.set(successParam === 'true');
      this.loading.set(false);
    }
  }
}
