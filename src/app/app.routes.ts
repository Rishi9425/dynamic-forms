import { Routes } from '@angular/router';
import { CardsComponent } from '../cards/cards.component';
import { DynamicFormComponent } from '../forms/forms.component';
import { EditFormComponentComponent } from '../edit-form-component/edit-form-component.component';

export const routes: Routes = [


    { path: 'cards', component: CardsComponent },
    {path: '', component: DynamicFormComponent},

   {
  path: 'edit/:id',
  component: EditFormComponentComponent
}
];
