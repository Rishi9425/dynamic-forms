import { Routes } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { DynamicFormComponent } from '../forms/forms.component'; // Your registration form
import { EditFormComponentComponent } from '../edit-form-component/edit-form-component.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { forgetPasswordComponent } from '../forget-password/forget-password.component';
import { UpdatePasswordComponent } from '../edit-password/edit-password.component';
import { HomePageComponent } from '../home-page/home-page.component';
import { authGuard } from '../guard/authguard';
import { loginGuard } from '../guard/loginguard';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [loginGuard] // Redirect to home if already logged in
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard] // Redirect to home if already logged in
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('../edit-form-component/edit-form-component.component').then((m) => m.EditFormComponentComponent),
    canActivate: [authGuard] // Require authentication
  },
  { 
    path: 'dashboard/:id', 
    component: DashboardComponent,
   // Require authentication
   canActivate: [authGuard] 
  },
  {
    path: 'forgot-password',
    component: forgetPasswordComponent
    
  },
  { 
    path: 'Update-password/:id', 
    component: UpdatePasswordComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'Home-Page', 
    component: HomePageComponent,
    canActivate: [authGuard] // Require authentication
  },
  {
    path: '**',
    redirectTo: '/login' // Redirect any unknown routes to login
  }
];