import { Injectable } from '@angular/core';
import { Reservation, SimulatedEmail } from '../models/court.model';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private readonly emailsStorageKey = 'sportreserve_sent_emails';
  private readonly adminEmail = 'info@sportreserve.com';

  sendReservationConfirmation(reservation: Reservation): SimulatedEmail[] {
    const emails = this.buildReservationEmails(reservation);
    const storedEmails = this.loadSentEmails();
    const updatedEmails = [...storedEmails, ...emails];

    localStorage.setItem(this.emailsStorageKey, JSON.stringify(updatedEmails));
    console.log('Emails simulados enviados:', emails);

    return emails;
  }

  getSentEmails(): SimulatedEmail[] {
    return this.loadSentEmails();
  }

  private buildReservationEmails(reservation: Reservation): SimulatedEmail[] {
    const sentAt = new Date();
    const date = this.formatDate(reservation.date);
    const time = `${this.formatHour(reservation.startTime)} - ${this.formatHour(reservation.endTime)}`;
    const customerType = reservation.isGuest ? 'Invitado' : 'Usuario registrado';

    return [
      {
        id: this.generateId(),
        to: reservation.userEmail,
        subject: 'Reserva confirmada - SportReserve',
        body: [
          'Tu reserva ha sido confirmada.',
          '',
          `Pista: ${reservation.courtName}`,
          `Fecha: ${date}`,
          `Hora: ${time}`,
          `Total: ${reservation.totalPrice} EUR`,
          `Metodo de pago: ${this.getPaymentMethodLabel(reservation.paymentMethod)}`,
          `Estado de pago: ${this.getPaymentStatusLabel(reservation.paymentStatus)}`,
          `Estado: ${this.getStatusLabel(reservation.status)}`,
          `Email: ${reservation.userEmail}`
        ].join('\n'),
        reservationId: reservation.id,
        type: 'customer-confirmation',
        sentAt
      },
      {
        id: this.generateId(),
        to: this.adminEmail,
        subject: 'Nueva reserva recibida - SportReserve',
        body: [
          'Se ha recibido una nueva reserva.',
          '',
          `ID: ${reservation.id}`,
          `Pista: ${reservation.courtName}`,
          `Fecha: ${date}`,
          `Hora: ${time}`,
          `Total: ${reservation.totalPrice} EUR`,
          `Metodo de pago: ${this.getPaymentMethodLabel(reservation.paymentMethod)}`,
          `Estado de pago: ${this.getPaymentStatusLabel(reservation.paymentStatus)}`,
          `Cliente: ${reservation.userName}`,
          `Email: ${reservation.userEmail}`,
          `Tipo: ${customerType}`,
          `Estado: ${this.getStatusLabel(reservation.status)}`
        ].join('\n'),
        reservationId: reservation.id,
        type: 'admin-notification',
        sentAt
      }
    ];
  }

  private loadSentEmails(): SimulatedEmail[] {
    const stored = localStorage.getItem(this.emailsStorageKey);
    if (!stored) return [];

    try {
      const emails = JSON.parse(stored) as SimulatedEmail[];
      return emails.map(email => ({
        ...email,
        sentAt: new Date(email.sentAt)
      }));
    } catch {
      localStorage.removeItem(this.emailsStorageKey);
      return [];
    }
  }

  private getStatusLabel(status: Reservation['status']): string {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  }

  private getPaymentMethodLabel(method: Reservation['paymentMethod']): string {
    return method === 'online' ? 'Online' : 'En el local';
  }

  private getPaymentStatusLabel(status: Reservation['paymentStatus']): string {
    return status === 'paid' ? 'Pagado' : 'Pendiente';
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full'
    }).format(new Date(date));
  }

  private formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  private generateId(): string {
    return 'email_' + Math.random().toString(36).substring(2, 9);
  }
}
