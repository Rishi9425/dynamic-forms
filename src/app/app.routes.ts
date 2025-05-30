import { Routes } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { DynamicFormComponent } from '../forms/forms.component'; // Your registration form
import { EditFormComponentComponent } from '../edit-form-component/edit-form-component.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import {  forgetPasswordComponent } from '../forget-password/forget-password.component';
import { UpdatePasswordComponent } from '../edit-password/edit-password.component';
import { authGuard } from '../guard/authguard';
import { HomePageComponent } from '../home-page/home-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('../edit-form-component/edit-form-component.component').then((m) => m.EditFormComponentComponent),
    
  },
  {
    path: 'dashboard/:id',
    component:DashboardComponent,

  },
  {
    path: 'forgot-password',
    // loadComponent: () =>
    //   import('../forget-password/forget-password.component').then((m) => m.EditPasswordComponent)
    component: forgetPasswordComponent

  },
  {
    path: 'Update-password/:id',
    loadComponent: () =>
      import('../edit-password/edit-password.component').then((m) => m.UpdatePasswordComponent),
  
    
  },
 {
    path: 'Home-Page',
    component:HomePageComponent,

  },
];



// app.routes.ts
