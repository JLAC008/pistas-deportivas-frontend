import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { PaymentConfirmRequest, PaymentConfirmResponse, PaymentInitiateResponse, PaymentResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  initiate(reservationId: string): Observable<PaymentInitiateResponse> {
    return this.http.post<PaymentInitiateResponse>(`${this.apiUrl}/payments/initiate`, { reservationId });
  }

  confirm(params: PaymentConfirmRequest): Observable<PaymentConfirmResponse> {
    return this.http.post<PaymentConfirmResponse>(`${this.apiUrl}/payments/confirm`, params);
  }

  getByReservation(reservationId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/payments/by-reservation/${reservationId}`);
  }

  getById(id: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/payments/${id}`);
  }
}
