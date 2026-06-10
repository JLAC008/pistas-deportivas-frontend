import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class App {
  authService = inject(AuthService);
  avatarOpen = signal(false);
  readonly currentYear = new Date().getFullYear();

  toggleAvatar(event: Event): void {
    event.stopPropagation();
    this.avatarOpen.update(v => !v);
  }

  @HostListener('document:click')
  closeAvatar(): void {
    this.avatarOpen.set(false);
  }

  logout(): void {
    this.avatarOpen.set(false);
    this.authService.logout();
  }
}
