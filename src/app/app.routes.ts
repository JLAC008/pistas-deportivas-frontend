import { Routes } from '@angular/router';
import { CourtsListComponent } from './pages/courts-list/courts-list.component';
import { CourtDetailComponent } from './pages/court-detail/court-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { MyReservationsComponent } from './pages/my-reservations/my-reservations.component';
import AdminComponent from './pages/admin/admin.component';
import { PaymentResultComponent } from './pages/payment-result/payment-result.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: CourtsListComponent },
  { path: 'pista/:id', component: CourtDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'my-reservations', component: MyReservationsComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: 'payment/result', component: PaymentResultComponent },
  { path: '**', redirectTo: '' }
];
