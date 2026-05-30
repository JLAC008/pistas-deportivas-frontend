import { Component, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Day {
  key: string;
  empty?: boolean;
  num?: number;
  disabled?: boolean;
  today?: boolean;
  selected?: boolean;
  available?: boolean;
  dateStr?: string;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css']
})
export class DatePickerComponent {
  readonly selected = input<string>('');
  readonly min = input<string>('');
  readonly selectDate = output<string>();

  private get todayDate(): Date { return new Date(); }
  private get minDate(): string { return this.toStr(this.todayDate); }
  private get maxDate(): string {
    const d = this.todayDate;
    return this.toStr(new Date(d.getFullYear(), d.getMonth() + 3, 0));
  }

  viewDate = signal(new Date());

  private clampView = effect(() => {
    const v = this.viewDate();
    const cy = this.todayDate.getFullYear();
    const cm = this.todayDate.getMonth();
    const vy = v.getFullYear();
    const vm = v.getMonth();
    const my = cy + Math.floor((cm + 2) / 12);
    const mm = (cm + 2) % 12;
    if (vy < cy || (vy === cy && vm < cm)) {
      this.viewDate.set(new Date(cy, cm, 1));
    } else if (vy > my || (vy === my && vm > mm)) {
      this.viewDate.set(new Date(my, mm, 1));
    }
  });

  readonly weekdays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
  readonly months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  readonly weekdaysFull = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  viewMonth = computed(() => this.viewDate().getMonth());
  viewYear = computed(() => this.viewDate().getFullYear());

  canGoPrev = computed(() => {
    const v = this.viewDate();
    const vy = v.getFullYear();
    const vm = v.getMonth();
    const cy = this.todayDate.getFullYear();
    const cm = this.todayDate.getMonth();
    return vy > cy || (vy === cy && vm > cm);
  });

  canGoNext = computed(() => {
    const v = this.viewDate();
    const vy = v.getFullYear();
    const vm = v.getMonth();
    const cy = this.todayDate.getFullYear();
    const cm = this.todayDate.getMonth();
    const my = cy + Math.floor((cm + 2) / 12);
    const mm = (cm + 2) % 12;
    return vy < my || (vy === my && vm < mm);
  });

  days = computed(() => {
    const d = this.viewDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const todayStr = this.minDate;
    const maxStr = this.maxDate;
    const sel = this.selected();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const pad = first.getDay();
    const total = last.getDate();

    const result: Day[] = [];
    for (let i = 0; i < pad; i++) {
      result.push({ key: `p${i}`, empty: true });
    }
    for (let n = 1; n <= total; n++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      result.push({
        key: `d${n}`,
        num: n,
        empty: false,
        disabled: ds < todayStr || ds > maxStr,
        today: ds === todayStr,
        selected: ds === sel,
        available: ds > todayStr,
        dateStr: ds
      });
    }
    while (result.length % 7 !== 0) {
      result.push({ key: `e${result.length}`, empty: true });
    }
    return result;
  });

  private toStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatFooter(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return `${this.weekdaysFull[d.getDay()]}, ${d.getDate()} de ${this.months[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
  }

  prevMonth(): void {
    if (!this.canGoPrev()) return;
    const d = new Date(this.viewDate());
    d.setMonth(d.getMonth() - 1);
    this.viewDate.set(d);
  }

  nextMonth(): void {
    if (!this.canGoNext()) return;
    const d = new Date(this.viewDate());
    d.setMonth(d.getMonth() + 1);
    this.viewDate.set(d);
  }

  pick(day: Day): void {
    if (day.dateStr && !day.disabled) {
      this.selectDate.emit(day.dateStr);
    }
  }
}
