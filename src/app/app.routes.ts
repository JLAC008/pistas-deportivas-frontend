import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CourtsListComponent } from './pages/courts-list/courts-list.component';
import { CourtDetailComponent } from './pages/court-detail/court-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { MyReservationsComponent } from './pages/my-reservations/my-reservations.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'courts', component: CourtsListComponent },
  { path: 'courts/:id', component: CourtDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'my-reservations', component: MyReservationsComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];
