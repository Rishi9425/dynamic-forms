import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ImportsModule } from './imports';
import { IFormStructure } from '../domain/forms';
import { FormService } from '../service/form-service.service';
import { Router, RouterModule } from '@angular/router';
import { Calendar } from 'primeng/calendar';
@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [ImportsModule, RouterModule, Calendar],
  templateUrl: './forms.component.html',
  styleUrl: './forms.component.scss'
})
export class DynamicFormComponent implements OnInit {
  formStructure: IFormStructure[] = [];
  dynamicForm!: FormGroup; // Marked with ! to indicate it's definitely assigned
  loading = true;
  submitting = false;

  constructor(private fb: FormBuilder, private formService: FormService, private router: Router) {}

  ngOnInit(): void {
    this.dynamicForm = this.fb.group({}); // ✅ Now initialized here

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

  private initForm(): void {
    let formGroup: Record<string, any> = {};

    this.formStructure.forEach((control) => {
      const controlValidators = this.getValidators(control);
      formGroup[control.name] = [control.value || '', controlValidators];
    });

    this.dynamicForm = this.fb.group(formGroup);
  }

  private getValidators(control: IFormStructure): any[] {
    if (!control.validations || !control.validations.length) return [];

    const validatorFunctions: Record<string, Function> = {
      required: () => Validators.required,
      email: () => Validators.email,
      minLength: (v: number) => Validators.minLength(v),
      maxLength: (v: number) => Validators.maxLength(v),
      pattern: (v: string) => Validators.pattern(v),
      min: (v: number) => Validators.min(v),
      max: (v: number) => Validators.max(v)
    };

    return control.validations
      .map(validation => {
        const fn = validatorFunctions[validation.validator];
        if (!fn) return null;
        if (['minLength', 'maxLength', 'pattern', 'min', 'max'].includes(validation.validator)) {
          return validation.value !== undefined ? fn(validation.value) : null;
        }
        return fn();
      })
      .filter(v => v !== null);
  }

  getErrorMessage(control: any): string {
    const formControl = this.dynamicForm.get(control.name);
    if (!formControl || !control.validations) return '';

    for (let validation of control.validations) {
      if (formControl.hasError(validation.validator)) {
        return validation.message;
      }
    }

    return '';
  }

  onSubmit(): void {
    if (!this.dynamicForm.valid) {
      this.dynamicForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.dynamicForm.value;

    console.log('Form data before submission:', formData);

    this.formService.submitFormData(formData).subscribe({
      next: (response) => {
        console.log('Form submitted successfully:', response);
        this.submitting = false;
        // Optionally reset or navigate
        // this.dynamicForm.reset();
         this.router.navigate(['/dashboard' ]);
      },
      error: (error) => {
        console.error('Error submitting form:', error);
        this.submitting = false;
      }

      
    });
  }

 show(): void {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'; // Or use your AuthService
  if (isLoggedIn) {
    this.router.navigate(['/cards']);
  } else {
    // Optionally, show a message or redirect to login
    console.warn('User not logged in. Redirecting to login page.');
    this.router.navigate(['/login']);
  }
}

  loadFormsFromBackend(): void {
    this.formService.getFormsFromBackend().subscribe({
      next: (forms) => {
        console.log('Forms from backend:', forms);
      },
      error: (error) => {
        console.error('Error loading forms from backend:', error);
      }
    });
  }
}
