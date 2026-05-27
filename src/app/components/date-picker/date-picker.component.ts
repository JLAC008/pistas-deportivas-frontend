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
  template: `
    <div class="cal">
      <div class="cal-head">
        <button class="cal-nav" [class.cal-nav-dis]="!canGoPrev()" [disabled]="!canGoPrev()" (click)="prevMonth()" aria-label="Mes anterior">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6l-4 4 4 4" />
          </svg>
        </button>
        <div class="cal-title">
          <span class="cal-month">{{ months[viewMonth()] }}</span>
          <span class="cal-year">{{ viewYear() }}</span>
        </div>
        <button class="cal-nav" [class.cal-nav-dis]="!canGoNext()" [disabled]="!canGoNext()" (click)="nextMonth()" aria-label="Mes siguiente">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6l4 4-4 4" />
          </svg>
        </button>
      </div>

      <div class="cal-weekdays">
        @for (d of weekdays; track d) {
          <span class="cal-wd">{{ d }}</span>
        }
      </div>

      <div class="cal-grid">
        @for (day of days(); track day.key) {
          @if (day.empty) {
            <div class="cal-cell cal-empty"></div>
          } @else {
            <button
              class="cal-cell"
              [class.cal-today]="day.today"
              [class.cal-sel]="day.selected"
              [class.cal-dis]="day.disabled"
              [disabled]="day.disabled"
              (click)="pick(day)">
              <span class="cal-num">{{ day.num }}</span>
            </button>
          }
        }
      </div>

      @if (selected(); as sel) {
        <div class="cal-foot">
          <span class="cal-foot-ico">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2.5" width="12" height="11.5" rx="1.5" />
              <path d="M2 6h12" />
              <path d="M5.5 1v3" />
              <path d="M10.5 1v3" />
            </svg>
          </span>
          <span class="cal-foot-text">{{ formatFooter(sel) }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .cal {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--white);
      border: 1px solid rgba(26,58,42,0.06);
      border-radius: 12px;
      padding: 0.9rem 0.85rem 0.6rem;
    }

    .cal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.65rem;
    }
    .cal-title { display: flex; align-items: baseline; gap: 0.4rem; }
    .cal-month {
      font-family: 'Fraunces', serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--forest);
      letter-spacing: 0.01em;
    }
    .cal-year {
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--muted);
    }
    .cal-nav {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 50%;
      background: var(--cream);
      color: var(--muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .cal-nav svg { width: 16px; height: 16px; }
    .cal-nav:hover {
      background: var(--sage-light);
      color: var(--forest);
      transform: scale(1.05);
    }
    .cal-nav:active {
      transform: scale(0.92);
    }
    .cal-nav.cal-nav-dis {
      opacity: 0.3;
      cursor: not-allowed;
      pointer-events: none;
    }

    .cal-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-bottom: 0.2rem;
    }
    .cal-wd {
      text-align: center;
      font-size: 0.58rem;
      font-weight: 600;
      color: var(--muted);
      padding: 0.1rem 0 0.2rem;
      letter-spacing: 0.05em;
    }

    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
    }
    .cal-cell {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 10px;
      background: transparent;
      cursor: pointer;
      padding: 0.45rem 0;
      min-height: 40px;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .cal-cell.cal-empty { cursor: default; }
    .cal-num {
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--gray-600);
      line-height: 1.2;
    }
    .cal-cell:not(.cal-dis):not(.cal-empty):hover {
      background: var(--sage-light);
      transform: translateY(-1px);
    }
    .cal-cell.cal-sel {
      background: var(--forest);
      border-radius: 12px;
      box-shadow: 0 4px 12px -4px rgba(26,58,42,0.3);
    }
    .cal-cell.cal-sel:hover {
      background: var(--forest-mid);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px -6px rgba(26,58,42,0.35);
    }
    .cal-cell.cal-sel .cal-num { color: var(--white); font-weight: 600; }
    .cal-cell.cal-today:not(.cal-sel) .cal-num { color: var(--leaf); font-weight: 700; }
    .cal-cell.cal-dis { cursor: not-allowed; }
    .cal-cell.cal-dis .cal-num { color: var(--gray-300); }
    .cal-foot {
      margin-top: 0.5rem;
      padding-top: 0.45rem;
      border-top: 1px solid rgba(26,58,42,0.05);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      justify-content: center;
    }
    .cal-foot-ico {
      display: flex;
      color: var(--muted);
      opacity: 0.6;
    }
    .cal-foot-ico svg { width: 12px; height: 12px; }
    .cal-foot-text {
      font-size: 0.7rem;
      color: var(--muted);
      font-weight: 450;
    }
  `]
})
export class DatePickerComponent {
  readonly selected = input<string>('');
  readonly min = input<string>('');
  readonly selectDate = output<string>();

  private today = new Date();
  private readonly minDate = this.toStr(this.today);
  private readonly maxDate = this.toStr(new Date(this.today.getFullYear(), this.today.getMonth() + 3, 0));

  viewDate = signal(new Date());

  private clampView = effect(() => {
    const v = this.viewDate();
    const cy = this.today.getFullYear();
    const cm = this.today.getMonth();
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
    const cy = this.today.getFullYear();
    const cm = this.today.getMonth();
    return vy > cy || (vy === cy && vm > cm);
  });

  canGoNext = computed(() => {
    const v = this.viewDate();
    const vy = v.getFullYear();
    const vm = v.getMonth();
    const cy = this.today.getFullYear();
    const cm = this.today.getMonth();
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
    return date.toISOString().split('T')[0];
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
    if (day.dateStr) {
      this.selectDate.emit(day.dateStr);
    }
  }
}
