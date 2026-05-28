import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourtService } from '../../services/court.service';

const COURT_TYPE_ICONS: Record<string, string> = {
  TENIS: '🎾',
  FUTBOL: '⚽',
  PADEL: '🏓',
  BALONCESTO: '🏀',
  VOLEIBOL: '🏐',
};

@Component({
  selector: 'app-courts-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './courts-list.component.html',
  styleUrls: ['./courts-list.component.css']
})
export class CourtsListComponent implements OnInit {
  private courtService = inject(CourtService);

  selectedType = signal<string>('all');

  readonly courtTypeIcons = COURT_TYPE_ICONS;
  courtTypes: string[] = ['TENIS', 'FUTBOL', 'PADEL', 'BALONCESTO', 'VOLEIBOL'];

  filteredCourts = computed(() => {
    let courts = this.courtService.courts();

    if (this.selectedType() !== 'all') {
      courts = courts.filter(c => c.type === this.selectedType());
    }

    courts = [...courts].sort((a, b) => a.name.localeCompare(b.name));

    return courts;
  });

  ngOnInit() {
    this.courtService.loadAll();
  }

  courtSlug(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
