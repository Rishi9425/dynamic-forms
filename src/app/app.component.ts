import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { DynamicFormComponent } from '../forms/forms.component';

@Component({
  selector: 'app-root',
  imports: [ RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'dynamic-forms';
}
