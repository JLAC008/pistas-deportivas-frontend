export interface Court {
  id: string;
  name: string;
  type: 'tenis' | 'futbol' | 'padel' | 'baloncesto' | 'voleibol';
  description: string;
  pricePerHour: number;
  image: string;
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
  courtId: string;
  courtName: string;
  userId: string;
  userName: string;
  userEmail: string;
  isGuest: boolean;
  date: Date;
  startTime: number;
  endTime: number;
  totalPrice: number;
  paymentMethod: 'online' | 'onsite';
  paymentStatus: 'paid' | 'pending';
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  reservationId: string;
  type: 'customer-confirmation' | 'admin-notification';
  sentAt: Date;
}
