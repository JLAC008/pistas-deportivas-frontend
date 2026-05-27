import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Court } from '../models/court.model';
import { AvailabilityResponse } from '../models/api.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class CourtService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private courtsSubject = new BehaviorSubject<Court[]>([]);
  readonly courts = toSignal(this.courtsSubject, { initialValue: [] });

  loadAll(): void {
    this.http.get<Court[]>(`${this.apiUrl}/courts`).subscribe(c => this.courtsSubject.next(c));
  }

  getAll(): Observable<Court[]> {
    return this.http.get<Court[]>(`${this.apiUrl}/courts`);
  }

  loadAdminAll(): void {
    this.http.get<Court[]>(`${this.apiUrl}/admin/courts`).subscribe(c => this.courtsSubject.next(c));
  }

  getById(id: string): Observable<Court> {
    return this.http.get<Court>(`${this.apiUrl}/courts/${id}`);
  }

  getAvailability(id: string, date: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${this.apiUrl}/courts/${id}/availability?date=${date}`);
  }

  create(data: {
    name: string;
    type: string;
    description: string;
    pricePerHour: number;
    imageUrl?: string;
    amenities: string[];
  }): Observable<Court> {
    return this.http.post<Court>(`${this.apiUrl}/admin/courts`, data);
  }

  update(id: string, data: {
    name: string;
    type: string;
    description: string;
    pricePerHour: number;
    imageUrl?: string;
    amenities: string[];
  }): Observable<Court> {
    return this.http.put<Court>(`${this.apiUrl}/admin/courts/${id}`, data);
  }

  toggle(id: string): Observable<never> {
    return this.http.patch<never>(`${this.apiUrl}/admin/courts/${id}/toggle`, {});
  }

  delete(id: string): Observable<never> {
    return this.http.delete<never>(`${this.apiUrl}/admin/courts/${id}`);
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/admin/upload`, formData);
  }
}
