import { Routes } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { CardsComponent } from '../cards/cards.component';
import { DynamicFormComponent } from '../forms/forms.component'; // Your registration form
import { EditFormComponentComponent } from '../edit-form-component/edit-form-component.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { EditPasswordComponent } from '../forget-password/forget-password.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: DynamicFormComponent },
    { path: 'cards', component: CardsComponent  }, 
  { path: '', component: LoginComponent },
  { path: 'edit/:id', component: EditFormComponentComponent },
  {path: 'dashboard/:id', component: DashboardComponent},
 {
    path: 'forgot-password',
    component: EditPasswordComponent
  },
  
];

// app.routes.ts
