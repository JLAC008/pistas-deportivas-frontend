import { Injectable, signal } from '@angular/core';
import { Court, Reservation, User, TimeSlot } from '../models/court.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private readonly reservationsStorageKey = 'sportreserve_reservations';

  private currentUser = signal<User | null>(null);
  private courts = signal<Court[]>(this.generateMockCourts());
  private reservations = signal<Reservation[]>(this.loadReservations());

  readonly $currentUser = this.currentUser.asReadonly();
  readonly $courts = this.courts.asReadonly();
  readonly $reservations = this.reservations.asReadonly();

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private loadReservations(): Reservation[] {
    const stored = localStorage.getItem(this.reservationsStorageKey);

    if (stored) {
      try {
        const reservations = JSON.parse(stored) as Reservation[];
        return reservations.map(reservation => ({
          ...reservation,
          userEmail: reservation.userEmail || '',
          isGuest: reservation.isGuest || false,
          paymentMethod: reservation.paymentMethod || 'onsite',
          paymentStatus: reservation.paymentStatus || 'pending',
          date: new Date(reservation.date),
          createdAt: new Date(reservation.createdAt)
        }));
      } catch {
        localStorage.removeItem(this.reservationsStorageKey);
      }
    }

    const reservations = this.generateMockReservations();
    this.saveReservations(reservations);
    return reservations;
  }

  private saveReservations(reservations: Reservation[]): void {
    localStorage.setItem(this.reservationsStorageKey, JSON.stringify(reservations));
  }

  private generateMockCourts(): Court[] {
    return [
      {
        id: 'c1',
        name: 'Pista Tenis Central',
        type: 'tenis',
        description: 'Pista de tenis profesional con superficie de arcilla verde. Iluminación LED y gradas para espectadores.',
        pricePerHour: 25,
        image: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
        isActive: true,
        maxPlayers: 4,
        amenities: ['Iluminación', 'Gradas', 'Vestuarios', 'Aparcamiento']
      },
      {
        id: 'c2',
        name: 'Campo Futbol 7 Norte',
        type: 'futbol',
        description: 'Campo de fútbol 7 con césped artificial de última generación. Ideal para partidos y entrenamientos.',
        pricePerHour: 45,
        image: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800',
        isActive: true,
        maxPlayers: 14,
        amenities: ['Césped artificial', 'Iluminación', 'Vestuarios', 'Duchas', 'Aparcamiento']
      },
      {
        id: 'c3',
        name: 'Pista Padel Premium',
        type: 'padel',
        description: 'Pista de pádel con cristal y malla. Superficie de hierba artificial de alta calidad.',
        pricePerHour: 30,
        image: 'https://images.pexels.com/photos/8612580/pexels-photo-8612580.jpeg?auto=compress&cs=tinysrgb&w=800',
        isActive: true,
        maxPlayers: 4,
        amenities: ['Cristal', 'Iluminación', 'Vestuarios']
      },
      {
        id: 'c4',
        name: 'Pista Baloncesto',
        type: 'baloncesto',
        description: 'Pista de baloncesto indoor con suelo de parquet profesional. Canastas reglamentarias.',
        pricePerHour: 20,
        image: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=800',
        isActive: true,
        maxPlayers: 10,
        amenities: ['Indoor', 'Suelo parquet', 'Marcador electrónico', 'Vestuarios']
      },
      {
        id: 'c5',
        name: 'Campo Futbol 11 Sur',
        type: 'futbol',
        description: 'Campo de fútbol 11 reglamentario con césped natural. Tribuna con capacidad para 200 personas.',
        pricePerHour: 80,
        image: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800',
        isActive: true,
        maxPlayers: 22,
        amenities: ['Césped natural', 'Tribuna', 'Iluminación', 'Vestuarios', 'Duchas', 'Aparcamiento']
      },
      {
        id: 'c6',
        name: 'Pista Voleibol Arena',
        type: 'voleibol',
        description: 'Pista de voleibol de arena profesional. Perfecta para partidos de beach volley.',
        pricePerHour: 35,
        image: 'https://images.pexels.com/photos/1618180/pexels-photo-1618180.jpeg?auto=compress&cs=tinysrgb&w=800',
        isActive: true,
        maxPlayers: 12,
        amenities: ['Arena', 'Iluminación', 'Duchas exteriores']
      }
    ];
  }

  private generateMockReservations(): Reservation[] {
    const users = [
      { id: 'u2', name: 'Usuario Demo', email: 'usuario@sports.com' },
      { id: 'u3', name: 'Maria Garcia', email: 'maria@example.com' },
      { id: 'u4', name: 'Carlos Lopez', email: 'carlos@example.com' }
    ];
    const courtNames = this.courts().map(c => c.name);
    const reservations: Reservation[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + Math.floor(Math.random() * 14) - 3);

      const courtIndex = Math.floor(Math.random() * this.courts().length);
      const court = this.courts()[courtIndex];

      const startHour = 8 + Math.floor(Math.random() * 10);
      const duration = 1 + Math.floor(Math.random() * 2);
      const user = users[Math.floor(Math.random() * users.length)];

      reservations.push({
        id: 'r' + this.generateId(),
        courtId: court.id,
        courtName: court.name,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        isGuest: false,
        date: date,
        startTime: startHour,
        endTime: startHour + duration,
        totalPrice: court.pricePerHour * duration,
        paymentMethod: 'onsite',
        paymentStatus: 'pending',
        status: date < today ? 'completed' : 'confirmed',
        createdAt: new Date(date.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }

    return reservations.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  login(email: string, password: string): boolean {
    if (email === 'admin@sports.com' && password === 'admin') {
      this.currentUser.set({
        id: 'u1',
        name: 'Administrador',
        email: 'admin@sports.com',
        phone: '+34 600 123 456',
        role: 'admin',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150'
      });
      return true;
    } else if (email && password) {
      this.currentUser.set({
        id: 'u2',
        name: 'Usuario Demo',
        email: email,
        phone: '+34 600 987 654',
        role: 'user',
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150'
      });
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.set(null);
  }

  getCourtById(id: string): Court | undefined {
    return this.courts().find(c => c.id === id);
  }

  getAvailableSlots(courtId: string, date: Date): TimeSlot[] {
    const court = this.getCourtById(courtId);
    if (!court) return [];

    const slots: TimeSlot[] = [];
    const dateReservations = this.reservations().filter(r =>
      r.courtId === courtId &&
      r.date.toDateString() === date.toDateString() &&
      r.status !== 'cancelled'
    );

    for (let hour = 8; hour <= 22; hour++) {
      const isBooked = dateReservations.some(r =>
        hour >= r.startTime && hour < r.endTime
      );
      slots.push({ hour, available: !isBooked });
    }

    return slots;
  }

  createReservation(
    courtId: string,
    date: Date,
    startHour: number,
    endHour: number,
    userId: string,
    userName: string,
    userEmail: string,
    isGuest: boolean,
    paymentMethod: 'online' | 'onsite',
    paymentStatus: 'paid' | 'pending'
  ): Reservation | null {
    const court = this.getCourtById(courtId);
    if (!court) return null;

    const overlapping = this.reservations().some(r =>
      r.courtId === courtId &&
      r.date.toDateString() === date.toDateString() &&
      r.status !== 'cancelled' &&
      startHour < r.endTime &&
      endHour > r.startTime
    );

    if (overlapping) return null;

    const reservation: Reservation = {
      id: 'r' + this.generateId(),
      courtId,
      courtName: court.name,
      userId,
      userName,
      userEmail,
      isGuest,
      date: new Date(date),
      startTime: startHour,
      endTime: endHour,
      totalPrice: court.pricePerHour * (endHour - startHour),
      paymentMethod,
      paymentStatus,
      status: 'confirmed',
      createdAt: new Date()
    };

    this.reservations.update(res => {
      const updatedReservations = [...res, reservation];
      this.saveReservations(updatedReservations);
      return updatedReservations;
    });
    return reservation;
  }

  cancelReservation(reservationId: string): boolean {
    const reservation = this.reservations().find(r => r.id === reservationId);
    if (!reservation) return false;

    this.reservations.update(res => {
      const updatedReservations = res.map(r =>
        r.id === reservationId ? { ...r, status: 'cancelled' as const } : r
      );
      this.saveReservations(updatedReservations);
      return updatedReservations;
    });
    return true;
  }

  getUserReservations(userId: string): Reservation[] {
    return this.reservations().filter(r => r.userId === userId);
  }

  // Admin methods
  addCourt(court: Omit<Court, 'id'>): Court {
    const newCourt: Court = {
      ...court,
      id: 'c' + this.generateId()
    };
    this.courts.update(courts => [...courts, newCourt]);
    return newCourt;
  }

  updateCourt(id: string, updates: Partial<Court>): Court | null {
    const court = this.getCourtById(id);
    if (!court) return null;

    this.courts.update(courts =>
      courts.map(c => c.id === id ? { ...c, ...updates } : c)
    );
    return this.getCourtById(id) || null;
  }

  deleteCourt(id: string): boolean {
    const hasReservations = this.reservations().some(r =>
      r.courtId === id && r.status === 'confirmed'
    );
    if (hasReservations) return false;

    this.courts.update(courts => courts.filter(c => c.id !== id));
    return true;
  }

  toggleCourtStatus(id: string): void {
    this.courts.update(courts =>
      courts.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)
    );
  }

  getAllReservations(): Reservation[] {
    return this.reservations();
  }

  updateReservationStatus(id: string, status: 'confirmed' | 'cancelled' | 'completed'): void {
    this.reservations.update(res => {
      const updatedReservations = res.map(r => r.id === id ? { ...r, status } : r);
      this.saveReservations(updatedReservations);
      return updatedReservations;
    });
  }

  updatePaymentStatus(id: string, paymentStatus: 'paid' | 'pending'): void {
    this.reservations.update(res => {
      const updatedReservations = res.map(r => r.id === id ? { ...r, paymentStatus } : r);
      this.saveReservations(updatedReservations);
      return updatedReservations;
    });
  }
}
