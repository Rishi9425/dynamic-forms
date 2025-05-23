import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ImportsModule } from './imports';
import { IFormStructure } from '../domain/forms';
import { FormService } from '../service/form-service.service';

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [ImportsModule],
  templateUrl: './forms.component.html',
  styleUrl: './forms.component.scss'
})
export class DynamicFormComponent implements OnInit {
  formStructure: IFormStructure[] = [];
  dynamicForm: FormGroup;
  loading = true;

  constructor(private fb: FormBuilder, private formService: FormService) {
    // Initialize with empty form group - we'll populate it after data loads
    this.dynamicForm = this.fb.group({});
  }
  
  ngOnInit(): void {
    // Simple way to get form data from service
    this.formService.getFormStructure()
      .then((data) => {
        this.formStructure = data;
        this.initForm();
        this.loading = false;
      })
      .catch((err) => {
        console.error('Error loading form data:', err);
        this.loading = false;
      });
  }

  // Initialize the form once we have the form structure
  private initForm(): void {
    let formGroup: Record<string, any> = {};
    
    this.formStructure.forEach((control) => {
      let controlValidators: any[] = [];

      if (control.validations) {
        control.validations.forEach(
          (validation: {
            name: string;
            validator: string;
            message: string;
            value?: any;
          }) => {
            if (validation.validator === 'required')
              controlValidators.push(Validators.required);
            if (validation.validator === 'email')
              controlValidators.push(Validators.email);
            if (validation.validator === 'minLength' && validation.value)
              controlValidators.push(Validators.minLength(validation.value));
            if (validation.validator === 'maxLength' && validation.value)
              controlValidators.push(Validators.maxLength(validation.value));
            if (validation.validator === 'pattern' && validation.value)
              controlValidators.push(Validators.pattern(validation.value));
            if (validation.validator === 'min' && validation.value !== undefined)
              controlValidators.push(Validators.min(validation.value));
            if (validation.validator === 'max' && validation.value !== undefined)
              controlValidators.push(Validators.max(validation.value));
            // Add more built-in validators as needed
          }
        );
      }

      formGroup[control.name] = [control.value || '', controlValidators];
    });

    this.dynamicForm = this.fb.group(formGroup);
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