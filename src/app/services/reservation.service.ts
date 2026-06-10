import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Reservation } from '../models/court.model';
import { ReservationRequest } from '../models/api.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
  readonly reservations = toSignal(this.reservationsSubject, { initialValue: [] });

  loadAll(): void {
    this.http.get<Reservation[]>(`${this.apiUrl}/reservations`).subscribe(r => this.reservationsSubject.next(r));
  }

  create(data: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/reservations`, data);
  }

  getById(id: string): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/reservations/${id}`);
  }

  cancel(id: string): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/reservations/${id}/cancel`, {});
  }

  updateStatus(id: string, status: string): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/reservations/${id}/status?status=${status}`, {});
  }

  updatePaymentStatus(id: string, paymentStatus: string): Observable<never> {
    return this.http.patch<never>(`${this.apiUrl}/reservations/${id}/payment-status?paymentStatus=${paymentStatus}`, {});
  }
}
