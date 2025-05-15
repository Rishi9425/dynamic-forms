import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ImportsModule } from './imports';
import { formConfig } from '../domain/form-config';
import { IFormStructure } from '../domain/forms';

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [ImportsModule],
  templateUrl: './forms.component.html',
  styleUrl: './forms.component.scss'
})
export class DynamicFormComponent implements OnInit {
  formStructure: IFormStructure[] = formConfig;
  dynamicForm: FormGroup;

  constructor(private fb: FormBuilder) {
    let formGroup: Record<string, any> = {};
    this.formStructure.forEach((control) => {
      let controlValidators: any[] = [];

      if (control.validations) {
        control.validations.forEach(
          (validation: {
            name: string;
            validator: string;
            message: string;
          }) => {
            if (validation.validator === 'required')
              controlValidators.push(Validators.required);
            if (validation.validator === 'email')
              controlValidators.push(Validators.email);
            // Add more built-in validators as needed
              
          }
        );
      }

      formGroup[control.name] = [control.value || '', controlValidators];
    });

    this.dynamicForm = this.fb.group(formGroup);
  }
  
  ngOnInit(): void {
    // Optionally, you can reset or initialize the form here if needed
    // For now, no additional initialization is required
  }

  getErrorMessage(control: any) {
    const formControl = this.dynamicForm.get(control.name);

    if (!formControl) {
      return '';
    }

    if (control.validations) {
      for (let validation of control.validations) {
        if (formControl.hasError(validation.validator)) {
          return validation.message;
        }
      }
    }

    return '';
  }

  onSubmit() {
    if (!this.dynamicForm.valid) {
      this.dynamicForm.markAllAsTouched();
      return;
    }
    console.log(this.dynamicForm.value);
  }
}