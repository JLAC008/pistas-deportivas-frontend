import {Component, computed, inject, signal, OnInit, AfterViewInit, ElementRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {CourtService} from '../../services/court.service';
import {ReservationService} from '../../services/reservation.service';
import {Court, Reservation} from '../../models/court.model';

interface AdminBookingSlot {
  courtId: string;
  courtName: string;
  hour: number;
  date: string;
}

interface MergedBlock {
  reservation: Reservation;
  courtId: string;
  startHour: number;
  endHour: number;
  duration: number;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
class AdminComponent implements OnInit, AfterViewInit {
  authService = inject(AuthService);
  courtService = inject(CourtService);
  reservationService = inject(ReservationService);

  @ViewChild('mobileCalendarStrip') mobileCalendarStrip!: ElementRef;

  activeTab = signal<'schedule' | 'courts' | 'reservations' | 'stats'>('schedule');
  showAddCourtModal = signal(false);
  editingCourt = signal<Court | null>(null);
  isUploading = signal(false);
  reservationFilter = signal<string>('all');
  reservationDateFilter = signal('');
  reservationHourFilter = signal<string>('all');
  reservationSort = signal<'created-desc' | 'date-asc' | 'date-desc'>('created-desc');
  scheduleDateFilter = signal(this.toDateInputValue(new Date()));
  scheduleStatusFilter = signal<string>('all');
  selectedReservation = signal<Reservation | null>(null);

  // Admin mini-form for empty slots
  adminBookingSlot = signal<AdminBookingSlot | null>(null);
  adminBookingLoading = signal(false);
  adminBookingError = signal('');
  adminFormData = { customerName: '', customerEmail: '', customerPhone: '' };

  // Single slot selection for booking (duration is determined by court)
  selectedSlots = signal<{courtId: string; courtName: string; hour: number; date: string}[]>([]);
  isRangeSelecting = signal(false);
  selectedCell = signal<{courtId: string; hour: number} | null>(null);

  // Mobile reservation modal
  showMobileReservationModal = signal(false);
  mobileReservationCourt = signal('');
  mobileReservationHour = signal('');
  mobileCourtFilter = signal<string>('all');
  mobileReservationForm = { customerName: '', customerEmail: '', customerPhone: '' };
  adminDropdownOpen = signal(false);

  reservationHours = Array.from({ length: 35 }, (_, i) => 7 + i * 0.5); // 7.0 to 24.0
  calendarHours = Array.from({ length: 18 }, (_, i) => 7 + i); // 7.0 to 24.0 (1-hour rows)
  readonly ROW_HEIGHT = 48;
  readonly START_HOUR = 7;

  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());

  courtForm = {
    name: '',
    type: 'TENIS' as string,
    description: '',
    durationMinutes: 60,
    price: 25,
    imageUrl: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
    amenitiesInput: '',
    isActive: true
  };

  ngOnInit() {
    this.courtService.loadAdminAll();
    this.reservationService.loadAll();
  }

  ngAfterViewInit() {
    setTimeout(() => this.scrollToSelected(), 250);
  }

  scrollToSelected() {
    if (!this.mobileCalendarStrip) return;
    const strip = this.mobileCalendarStrip.nativeElement;
    const selectedEl = strip.querySelector('.selected') || strip.querySelector('.today');
    if (selectedEl) {
      selectedEl.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }

  switchTab(tab: 'schedule' | 'courts' | 'reservations' | 'stats'): void {
    this.activeTab.set(tab);
    if (tab === 'courts') this.courtService.loadAdminAll();
    if (tab === 'reservations' || tab === 'schedule' || tab === 'stats') this.reservationService.loadAll();
    if (tab === 'schedule') {
      setTimeout(() => this.scrollToSelected(), 250);
    }
  }

  activeCourtsCount = computed(() =>
    this.courtService.courts().filter(c => c.isActive).length
  );

  confirmedReservations = computed(() =>
    this.reservationService.reservations().filter(r => r.status === 'CONFIRMED').length
  );

  totalRevenue = computed(() =>
    this.reservationService.reservations()
      .filter(r => r.status !== 'CANCELLED')
      .reduce((sum, r) => sum + r.totalPrice, 0)
  );

  mostPopularCourt = computed(() => {
    const courts = new Map<string, number>();
    this.reservationService.reservations()
      .filter(r => r.status !== 'CANCELLED')
      .forEach(r => courts.set(r.court.name, (courts.get(r.court.name) || 0) + 1));
    const sorted = [...courts.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'N/A';
  });

  mostPopularHour = computed(() => {
    const hourCounts = new Map<number, number>();
    this.reservationService.reservations()
      .filter(r => r.status !== 'CANCELLED')
      .forEach(r => {
        for (let t = r.startTime; t < r.endTime; t += 0.5) {
          const rounded = Math.round(t * 10) / 10;
          hourCounts.set(rounded, (hourCounts.get(rounded) || 0) + 1);
        }
      });
    const sorted = [...hourCounts.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 0;
  });

  filteredReservations = computed(() => {
    const filter = this.reservationFilter();
    const dateFilter = this.reservationDateFilter();
    const hourFilter = this.reservationHourFilter();
    const sort = this.reservationSort();
    let res = this.reservationService.reservations();

    if (filter !== 'all') {
      res = res.filter(r => r.status === filter);
    }

    if (dateFilter) {
      res = res.filter(r => r.date === dateFilter);
    }

    if (hourFilter !== 'all') {
      const hour = Number(hourFilter);
      res = res.filter(r => hour >= r.startTime && hour < r.endTime);
    }

    return [...res].sort((a, b) => {
      if (sort === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sort === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  calendarCourts = computed(() =>
    this.courtService.courts().filter(court => court.isActive)
  );

  // Mobile: timeline blocks filtered by court
  mobileTimelineBlocks = computed(() => {
    const blocks = this.mergedBlocks();
    const courtFilter = this.mobileCourtFilter();
    if (courtFilter === 'all') return blocks;
    return blocks.filter(b => b.courtId === courtFilter);
  });

  // Mobile: available half-hour start slots for a given court
  mobileAvailableHours = computed(() => {
    const courtId = this.mobileReservationCourt();
    if (!courtId) return [];
    const court = this.calendarCourts().find(c => c.id === courtId);
    if (!court) return [];
    const date = this.scheduleDateFilter();
    const duration = court.durationMinutes / 60;
    const existing = this.scheduledReservations().filter(r => r.court.id === courtId && r.date === date);
    return this.calendarHours.filter(hour => {
      const end = hour + duration;
      if (end > 24.0) return false;
      return !existing.some(r => hour < r.endTime && end > r.startTime);
    });
  });

  scheduledReservations = computed(() => {
    const dateFilter = this.scheduleDateFilter();
    const statusFilter = this.scheduleStatusFilter();
    const courtIds = new Set(this.calendarCourts().map(court => court.id));

    return this.reservationService.reservations().filter(reservation => {
      const matchesCourt = courtIds.has(reservation.court.id);
      const matchesDate = reservation.date === dateFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        reservation.status === statusFilter ||
        (statusFilter === 'pending-payment' && (reservation.status === 'PENDING_PAYMENT' || reservation.paymentStatus === 'PENDING'));

      return matchesCourt && matchesDate && matchesStatus && reservation.status !== 'CANCELLED';
    });
  });

  scheduleOccupancy = computed(() => {
    const totalSlots = this.calendarCourts().length * this.calendarHours.length;
    if (!totalSlots) return 0;
    const bookedSlots = this.scheduledReservations().reduce(
      (sum, reservation) => sum + (reservation.endTime - reservation.startTime),
      0
    );
    return Math.min(100, Math.round((bookedSlots / totalSlots) * 100));
  });

  pendingSchedulePayments = computed(() =>
    this.scheduledReservations().filter(reservation =>
      reservation.status === 'PENDING_PAYMENT' || reservation.paymentStatus === 'PENDING'
    ).length
  );

  selectedTimeRange = computed(() => {
    const slots = this.selectedSlots();
    if (slots.length === 0) return null;
    const court = this.calendarCourts().find(c => c.id === slots[0].courtId);
    const duration = court ? court.durationMinutes / 60 : 1;
    return {
      start: slots[0].hour,
      end: slots[0].hour + duration,
      count: 1,
      courtName: slots[0].courtName,
      courtId: slots[0].courtId
    };
  });

  // P1: Selection block for single slot
  selectionBlocks = computed(() => {
    const slots = this.selectedSlots();
    if (slots.length === 0) return [];
    const court = this.calendarCourts().find(c => c.id === slots[0].courtId);
    const duration = court ? court.durationMinutes / 60 : 1;
    return [{
      courtId: slots[0].courtId,
      courtName: slots[0].courtName,
      startHour: slots[0].hour,
      endHour: slots[0].hour + duration,
      duration
    }];
  });

  // P4: Calendar limits
  firstReservationDate = computed(() => {
    const reservations = this.reservationService.reservations()
      .filter(r => r.status !== 'CANCELLED');
    if (reservations.length === 0) return null;
    const dates = reservations.map(r => new Date(r.date + 'T00:00:00').getTime());
    return new Date(Math.min(...dates));
  });

  daySummary = computed(() => {
    const reservations = this.scheduledReservations();
    const totalRevenue = reservations.reduce((sum, r) => sum + r.totalPrice, 0);
    const activeCourts = this.activeCourtsCount();
    return {
      totalReservations: reservations.length,
      totalRevenue,
      activeCourts
    };
  });

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const today = new Date();
    const selectedDate = new Date(this.scheduleDateFilter());

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: this.isSameDay(date, today),
        isSelected: this.isSameDay(date, selectedDate)
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        day: d,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, today),
        isSelected: this.isSameDay(date, selectedDate)
      });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push({
        date,
        day: d,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, today),
        isSelected: this.isSameDay(date, selectedDate)
      });
    }

    return days;
  });

  // Mobile: first reservation (or today) forwards 3 months
  mobileCalendarDays = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(this.scheduleDateFilter());

    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);

    const minDate = this.getEffectiveMinDate();

    const days: CalendarDay[] = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      days.push({
        date: new Date(current),
        day: current.getDate(),
        isCurrentMonth: true,
        isToday: this.isSameDay(current, today),
        isSelected: this.isSameDay(current, selectedDate)
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  });

  mergedBlocks = computed(() => {
    const reservations = this.scheduledReservations();
    const blocks: MergedBlock[] = [];

    const byCourt = new Map<string, Reservation[]>();
    for (const r of reservations) {
      const list = byCourt.get(r.court.id) || [];
      list.push(r);
      byCourt.set(r.court.id, list);
    }

    for (const [courtId, courtReservations] of byCourt) {
      const sorted = [...courtReservations].sort((a, b) => a.startTime - b.startTime);
      const merged: MergedBlock[] = [];
      let current: MergedBlock | null = null;

      for (const res of sorted) {
        if (current && current.endHour === res.startTime && current.reservation.customerName === res.customerName && current.reservation.customerEmail === res.customerEmail) {
          current.endHour = res.endTime;
          current.duration = current.endHour - current.startHour;
        } else {
          if (current) merged.push(current);
          current = {
            reservation: res,
            courtId,
            startHour: res.startTime,
            endHour: res.endTime,
            duration: res.endTime - res.startTime
          };
        }
      }
      if (current) merged.push(current);
      blocks.push(...merged);
    }

    return blocks;
  });

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // P4: Calendar navigation limits
  private getEffectiveMinDate(): Date {
    const first = this.firstReservationDate();
    const d = first ? new Date(first) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getMinMonth(): { year: number; month: number } {
    const min = this.getEffectiveMinDate();
    return { year: min.getFullYear(), month: min.getMonth() };
  }

  private getMaxMonth(): { year: number; month: number } {
    const today = new Date();
    let maxMonth = today.getMonth() + 3;
    let maxYear = today.getFullYear();
    while (maxMonth > 11) {
      maxMonth -= 12;
      maxYear += 1;
    }
    return { year: maxYear, month: maxMonth };
  }

  canGoPrevMonth(): boolean {
    const cur = { year: this.currentYear(), month: this.currentMonth() };
    const min = this.getMinMonth();
    return cur.year > min.year || (cur.year === min.year && cur.month > min.month);
  }

  canGoNextMonth(): boolean {
    const cur = { year: this.currentYear(), month: this.currentMonth() };
    const max = this.getMaxMonth();
    return cur.year < max.year || (cur.year === max.year && cur.month < max.month);
  }

  isDayDisabled(day: CalendarDay): boolean {
    if (!day.isCurrentMonth) return true;
    const dayDate = day.date;
    dayDate.setHours(0, 0, 0, 0);

    // No antes de la primera reserva (o hoy si no hay reservas)
    const minDate = this.getEffectiveMinDate();
    if (dayDate < minDate) return true;

    // Fecha maxima: hoy + 3 meses
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);

    return dayDate > maxDate;
  }

  prevMonth(): void {
    if (!this.canGoPrevMonth()) return;
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (!this.canGoNextMonth()) return;
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
  }

  selectDay(day: CalendarDay): void {
    if (this.isDayDisabled(day)) return;
    const dateStr = this.toDateInputValue(day.date);
    this.scheduleDateFilter.set(dateStr);
    this.syncCalendarToDate(day.date);
    setTimeout(() => this.scrollToSelected(), 50);
  }

  prevDay(): void {
    if (!this.canGoPrevDay()) return;
    const current = new Date(this.scheduleDateFilter());
    current.setDate(current.getDate() - 1);
    this.scheduleDateFilter.set(this.toDateInputValue(current));
    this.syncCalendarToDate(current);
    setTimeout(() => this.scrollToSelected(), 50);
  }

  nextDay(): void {
    if (!this.canGoNextDay()) return;
    const current = new Date(this.scheduleDateFilter());
    current.setDate(current.getDate() + 1);
    this.scheduleDateFilter.set(this.toDateInputValue(current));
    this.syncCalendarToDate(current);
    setTimeout(() => this.scrollToSelected(), 50);
  }

  canGoPrevDay(): boolean {
    const current = new Date(this.scheduleDateFilter());
    const min = this.getEffectiveMinDate();
    current.setHours(0, 0, 0, 0);
    return current > min;
  }

  canGoNextDay(): boolean {
    const current = new Date(this.scheduleDateFilter());
    const max = this.getMaxMobileDate();
    current.setHours(0, 0, 0, 0);
    return current < max;
  }

  private getMinMobileDate(): Date {
    return this.getEffectiveMinDate();
  }

  private getMaxMobileDate(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() + 3);
    return d;
  }

  // P5 + P6: Sync left calendar to the selected date's month
  syncCalendarToDate(date: Date): void {
    this.currentMonth.set(date.getMonth());
    this.currentYear.set(date.getFullYear());
  }

  getMonthName(): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[this.currentMonth()]} ${this.currentYear()}`;
  }

  formatLongDate(dateStr: string): string {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const date = new Date(dateStr + 'T00:00:00');
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  isPastSlot(hour: number): boolean {
    const today = this.toDateInputValue(new Date());
    if (this.scheduleDateFilter() < today) return true;
    if (this.scheduleDateFilter() !== today) return false;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return hour < currentHour;
  }

  getMergedBlockForCell(courtId: string, hour: number): MergedBlock | null {
    const block = this.mergedBlocks().find(b =>
      b.courtId === courtId && b.startHour === hour
    );
    return block || null;
  }

  isPartOfMergedBlock(courtId: string, hour: number): boolean {
    return this.mergedBlocks().some(b =>
      b.courtId === courtId && hour > b.startHour && hour < b.endHour
    );
  }

  // P1: Selection block helpers
  getSelectionBlockForCell(courtId: string, hour: number): { courtId: string; courtName: string; startHour: number; endHour: number; duration: number } | null {
    const block = this.selectionBlocks().find(b =>
      b.courtId === courtId && b.startHour === hour
    );
    return block || null;
  }

  isPartOfSelection(courtId: string, hour: number): boolean {
    return this.selectionBlocks().some(b =>
      b.courtId === courtId && hour > b.startHour && hour < b.endHour
    );
  }

  // P3: Past date check
  isPastDate(): boolean {
    const minDate = this.toDateInputValue(this.getEffectiveMinDate());
    return this.scheduleDateFilter() < minDate;
  }

  getBlockHeight(block: MergedBlock): number {
    return block.duration * 44;
  }

  getBlockTop(block: MergedBlock): number {
    const halfHourOffset = (block.startHour % 1) * 44;
    return halfHourOffset;
  }

  getBookingBlockStyle(block: MergedBlock): { top: string; height: string } {
    const topPx = (block.startHour - this.START_HOUR) * this.ROW_HEIGHT;
    const heightPx = block.duration * this.ROW_HEIGHT;
    return {
      top: `${topPx + 2}px`,
      height: `${heightPx - 4}px`
    };
  }

  isCellPast(courtId: string, hour: number): boolean {
    const today = this.toDateInputValue(new Date());
    if (this.scheduleDateFilter() < today) return true;
    if (this.scheduleDateFilter() !== today) return false;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return hour < currentHour;
  }

  isHourPast(hour: number): boolean {
    if (!this.isToday()) return false;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return hour < currentHour;
  }

  isSlotBookable(courtId: string, hour: number): boolean {
    return !this.isCellPast(courtId, hour) && !this.isPartOfMergedBlock(courtId, hour);
  }

  getNowPosition(): number {
    const today = this.toDateInputValue(new Date());
    if (this.scheduleDateFilter() !== today) return -1;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    if (currentHour < this.START_HOUR || currentHour >= 24) return -1;
    return (currentHour - this.START_HOUR) * this.ROW_HEIGHT;
  }

  isToday(): boolean {
    return this.scheduleDateFilter() === this.toDateInputValue(new Date());
  }

  getClickedTime(courtId: string, courtName: string, event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const hour = Math.floor(y / this.ROW_HEIGHT) + this.START_HOUR;
    const half = y % this.ROW_HEIGHT >= this.ROW_HEIGHT / 2 ? 0.5 : 0;
    const clickedHour = hour + half;
    if (clickedHour >= 24) return;
    if (this.isCellPast(courtId, clickedHour)) return;
    if (this.isPartOfMergedBlock(courtId, clickedHour)) return;
    this.selectedCell.set({ courtId, hour: clickedHour });
    this.openAdminBooking(courtId, courtName, clickedHour);
  }

  isSelectedCell(courtId: string, hour: number): boolean {
    const cell = this.selectedCell();
    return cell !== null && cell.courtId === courtId && cell.hour === hour;
  }

  getHourBlocksForCell(courtId: string, hour: number): MergedBlock[] {
    return this.mergedBlocks().filter(b =>
      b.courtId === courtId && b.startHour >= hour && b.startHour < hour + 1
    );
  }

  getCalendarReservation(courtId: string, hour: number): Reservation | null {
    return this.scheduledReservations().find(reservation =>
      reservation.court.id === courtId &&
      hour >= reservation.startTime &&
      hour < reservation.endTime
    ) || null;
  }

  formatHour(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  toggleSlot(courtId: string, courtName: string, hour: number): void {
    const current = this.selectedSlots();
    const existingIdx = current.findIndex(s => s.courtId === courtId && s.hour === hour);

    if (existingIdx >= 0) {
      this.selectedSlots.set([]);
    } else {
      this.selectedSlots.set([{ courtId, courtName, hour, date: this.scheduleDateFilter() }]);
    }

    this.selectedReservation.set(null);

    if (this.selectedSlots().length === 0) {
      this.closeAdminBooking();
    } else {
      this.adminBookingError.set('');
      this.adminBookingSlot.set({
        courtId,
        courtName,
        hour: this.selectedSlots()[0].hour,
        date: this.scheduleDateFilter()
      });
    }
  }

  isSlotSelected(courtId: string, hour: number): boolean {
    return this.selectedSlots().some(s => s.courtId === courtId && s.hour === hour);
  }

  selectReservation(reservation: Reservation): void {
    this.selectedReservation.set(reservation);
    this.selectedSlots.set([]);
    this.adminBookingSlot.set(null);
  }

  closeDetailOverlay(): void {
    if (window.innerWidth <= 768) {
      this.selectedReservation.set(null);
    }
  }

  openAdminBooking(courtId: string, courtName: string, hour: number): void {
    this.selectedReservation.set(null);
    this.adminBookingError.set('');
    this.adminFormData = { customerName: '', customerEmail: '', customerPhone: '' };
    this.selectedSlots.set([{ courtId, courtName, hour, date: this.scheduleDateFilter() }]);
    this.adminBookingSlot.set({ courtId, courtName, hour, date: this.scheduleDateFilter() });
  }

  closeAdminBooking(): void {
    this.selectedSlots.set([]);
    this.adminBookingSlot.set(null);
    this.adminBookingError.set('');
    this.selectedCell.set(null);
  }

  createAdminReservation(): void {
    const timeRange = this.selectedTimeRange();
    if (!timeRange) return;

    const { customerName, customerEmail, customerPhone } = this.adminFormData;
    if (!customerName.trim() || !customerEmail.trim()) {
      this.adminBookingError.set('Nombre y email son obligatorios.');
      return;
    }

    this.adminBookingLoading.set(true);
    this.adminBookingError.set('');

    this.reservationService.create({
      courtId: timeRange.courtId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || undefined,
      date: this.scheduleDateFilter(),
      startTime: timeRange.start,
      paymentMethod: 'ONSITE'
    }).subscribe({
      next: () => {
        this.adminBookingLoading.set(false);
        this.closeAdminBooking();
        this.reservationService.loadAll();
      },
      error: (err) => {
        this.adminBookingLoading.set(false);
        this.adminBookingError.set(err?.error?.message || 'Error al crear la reserva. Comprueba disponibilidad.');
      }
    });
  }

  clearScheduleFilters(): void {
    const today = new Date();
    this.scheduleDateFilter.set(this.toDateInputValue(today));
    this.syncCalendarToDate(today);
    this.scheduleStatusFilter.set('all');
    this.selectedReservation.set(null);
    this.closeAdminBooking();
    this.selectedSlots.set([]);
    setTimeout(() => this.scrollToSelected(), 50);
  }

  clearReservationFilters(): void {
    this.reservationFilter.set('all');
    this.reservationDateFilter.set('');
    this.reservationHourFilter.set('all');
    this.reservationSort.set('created-desc');
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  reservationsByType = computed(() => {
    const typeCount = new Map<string, number>();
    const courts = this.courtService.courts();

    courts.forEach(c => typeCount.set(c.type, 0));

    this.reservationService.reservations()
      .filter(r => r.status !== 'CANCELLED')
      .forEach(r => {
        typeCount.set(r.court.type, (typeCount.get(r.court.type) || 0) + 1);
      });

    const total = [...typeCount.values()].reduce((sum, v) => sum + v, 0);
    const result: { type: string; count: number; percentage: number }[] = [];

    typeCount.forEach((count, type) => {
      result.push({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      });
    });

    return result.sort((a, b) => b.count - a.count);
  });

  editCourt(court: Court): void {
    this.editingCourt.set(court);
    this.courtForm = {
      name: court.name,
      type: court.type,
      description: court.description || '',
      durationMinutes: court.durationMinutes,
      price: court.price,
      imageUrl: court.imageUrl || '',
      amenitiesInput: court.amenities.join(', '),
      isActive: court.isActive
    };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;

    this.isUploading.set(true);
    this.courtService.uploadImage(file).subscribe({
      next: (res) => {
        this.courtForm.imageUrl = res.url;
        this.isUploading.set(false);
      },
      error: () => {
        this.isUploading.set(false);
      }
    });
  }

  removeImage(): void {
    this.courtForm.imageUrl = '';
  }

  closeModal(): void {
    this.showAddCourtModal.set(false);
    this.editingCourt.set(null);
    this.resetForm();
  }

  resetForm(): void {
    this.courtForm = {
      name: '',
      type: 'TENIS',
      description: '',
      durationMinutes: 60,
      price: 25,
      imageUrl: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
      amenitiesInput: '',
      isActive: true
    };
  }

  saveCourt(): void {
    const amenities = this.courtForm.amenitiesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const courtData = {
      name: this.courtForm.name,
      type: this.courtForm.type,
      description: this.courtForm.description,
      durationMinutes: this.courtForm.durationMinutes,
      price: this.courtForm.price,
      imageUrl: this.courtForm.imageUrl,
      amenities
    };

    const editing = this.editingCourt();
    const request = editing
      ? this.courtService.update(editing.id, courtData)
      : this.courtService.create(courtData);

    request.subscribe({
      next: () => {
        this.courtService.loadAdminAll();
        this.closeModal();
      }
    });
  }

  toggleCourtStatus(id: string): void {
    this.courtService.toggle(id).subscribe({
      next: () => this.courtService.loadAdminAll()
    });
  }

  deleteCourt(court: Court): void {
    if (confirm(`Seguro que quieres eliminar "${court.name}"?`)) {
      this.courtService.delete(court.id).subscribe({
        next: () => this.courtService.loadAdminAll(),
        error: () => alert('No se puede eliminar: tiene reservas activas')
      });
    }
  }

  updateReservationStatus(id: string, status: string): void {
    this.reservationService.updateStatus(id, status).subscribe({
      next: () => this.reservationService.loadAll()
    });
  }

  updatePaymentStatus(id: string, paymentStatus: string): void {
    this.reservationService.updatePaymentStatus(id, paymentStatus).subscribe({
      next: () => {
        this.selectedReservation.set(null);
        this.reservationService.loadAll();
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING_PAYMENT': return 'Pendiente pago';
      case 'CONFIRMED': return 'Confirmada';
      case 'CANCELLED': return 'Cancelada';
      case 'COMPLETED': return 'Completada';
      default: return status;
    }
  }

  getPaymentMethodLabel(method: string): string {
    return method === 'ONLINE' ? 'Online' : 'Local';
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Pagado';
      case 'PENDING': return 'Pendiente';
      case 'FAILED': return 'Fallido';
      default: return status;
    }
  }

  getDayShortName(date: Date): string {
    const names = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    return names[date.getDay()];
  }

  // Mobile reservation modal
  openMobileReservation(): void {
    this.mobileReservationForm = { customerName: '', customerEmail: '', customerPhone: '' };
    this.mobileReservationCourt.set('');
    this.mobileReservationHour.set('');
    this.adminDropdownOpen.set(false);
    this.showMobileReservationModal.set(true);
  }

  closeMobileReservation(): void {
    this.showMobileReservationModal.set(false);
    this.adminDropdownOpen.set(false);
  }

  toggleAdminDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.adminDropdownOpen.update(v => !v);
  }

  getSelectedCourtDuration(): number {
    const court = this.calendarCourts().find(c => c.id === this.mobileReservationCourt());
    return court ? court.durationMinutes / 60 : 1;
  }

  getSelectedCourtPrice(): number {
    const court = this.calendarCourts().find(c => c.id === this.mobileReservationCourt());
    return court ? court.price : 0;
  }

  formatDuration(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours === 1) return '1h';
    if (hours === 1.5) return '1h 30min';
    return `${hours}h`;
  }

  createMobileReservation(): void {
    const courtId = this.mobileReservationCourt();
    const hour = Number(this.mobileReservationHour());
    const { customerName, customerEmail, customerPhone } = this.mobileReservationForm;

    if (!courtId || !hour || !customerName.trim() || !customerEmail.trim()) return;

    const court = this.calendarCourts().find(c => c.id === courtId);
    if (!court) return;

    this.adminBookingLoading.set(true);
    this.adminBookingError.set('');

    this.reservationService.create({
      courtId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || undefined,
      date: this.scheduleDateFilter(),
      startTime: hour,
      paymentMethod: 'ONSITE'
    }).subscribe({
      next: () => {
        this.adminBookingLoading.set(false);
        this.closeMobileReservation();
        this.reservationService.loadAll();
      },
      error: (err) => {
        this.adminBookingLoading.set(false);
        this.adminBookingError.set(err?.error?.message || 'Error al crear la reserva.');
      }
    });
  }
}

export default AdminComponent;
