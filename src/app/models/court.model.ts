export type CourtType = 'TENIS' | 'FUTBOL' | 'PADEL' | 'BALONCESTO' | 'VOLEIBOL';
export type PaymentMethod = 'ONLINE' | 'ONSITE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  description: string | null;
  pricePerHour: number;
  imageUrl: string | null;
  isActive: boolean;
  maxPlayers: number;
  amenities: string[];
}

export interface TimeSlot {
  hour: number;
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
  status: ReservationStatus;
  createdAt: string;
}
