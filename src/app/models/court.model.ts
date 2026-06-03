export type CourtType = 'TENIS' | 'FUTBOL' | 'PADEL' | 'BALONCESTO' | 'VOLEIBOL' | 'FRONTON';
export type PaymentMethod = 'ONLINE' | 'ONSITE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type ReservationStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  description: string | null;
  durationMinutes: number;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  amenities: string[];
}

export interface TimeSlot {
  time: number;
  available: boolean;
}

export interface Reservation {
  id: string;
  court: Court;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  date: string;
  startTime: number;
  endTime: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bookingGroup: string | null;
  status: ReservationStatus;
  createdAt: string;
}
