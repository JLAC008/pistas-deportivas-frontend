import { TimeSlot } from './court.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export interface ReservationRequest {
  courtId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  startTime: number;
  endTime?: number;
  paymentMethod: string;
  bookingGroup?: string;
}

export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}

export interface PaymentInitiateRequest {
  reservationId: string;
}

export interface PaymentInitiateResponse {
  url: string;
  dsSignatureVersion: string;
  dsMerchantParameters: string;
  dsSignature: string;
}

export interface PaymentResponse {
  id: string;
  reservationId: string;
  redsysOrder: string;
  amount: number;
  status: string;
  redsysTransactionId: string | null;
  createdAt: string;
  updatedAt: string | null;
}
