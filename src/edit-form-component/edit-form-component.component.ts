import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ImportsModule } from './imports';
import { IFormStructure } from '../domain/forms';
import { FormService } from '../service/form-service.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DatePicker } from 'primeng/datepicker';

@Component({
  selector: 'app-edit-form-component',
  standalone: true,
  imports: [ImportsModule, RouterModule, DatePicker],
  templateUrl: './edit-form-component.component.html',
  styleUrls: ['./edit-form-component.component.scss'],
})
export class EditFormComponentComponent implements OnInit {
  formStructure: IFormStructure[] = [];
  dynamicForm!: FormGroup;
  loading = true;
  submitting = false;
  formId: number = 0;
  existingFormData: any = null;

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.dynamicForm = this.fb.group({});

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.formId = +params['id'];
        this.loadFormData();
      }
    });
  }

  //load form structure
  private loadFormData(): void {
    console.log('Loading form data for ID:', this.formId);

    this.formService
      .getFormStructure()
      .then((data) => {
        // Filter out username and email if they are part of the form structure for editing
        this.formStructure = data.filter(
          (control) =>
            control.name !== 'username' &&
            control.name !== 'email' &&
            control.name !== 'password' &&
            control.name !== 'confirmPassword'
        );
        this.loadExistingFormData();
      })
      .catch((err) => {
        console.error('Error loading form structure:', err);
        this.loading = false;
      });
  }

  //get this data inside the field
  private loadExistingFormData(): void {
    // Call getFormByUserId instead of getFormsFromBackend to fetch a single user's data
    this.formService.getFormByUserId(this.formId).subscribe({
      next: (existingForm) => {
        console.log('Existing form data loaded:', existingForm);
        if (existingForm) {
          this.existingFormData = existingForm;
          this.initFormWithData();
        } else {
          console.log('No existing form found, initializing empty form');
          this.initForm();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading existing form data:', error);
        this.initForm(); // Initialize an empty form if data loading fails
        this.loading = false;
      },
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

  // Helper method to create date without timezone issues
  private createLocalDate(dateValue: any): Date | null {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
      // If it's already a Date object, create a new date with local timezone
      return new Date(
        dateValue.getFullYear(),
        dateValue.getMonth(),
        dateValue.getDate()
      );
    }

    if (typeof dateValue === 'string') {
      // Handle string dates - parse and create local date
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        // Create a new date using the parsed date's components to avoid timezone issues
        return new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate()
        );
      }
    }

    return null;
  }

  // Helper method to format date for submission (YYYY-MM-DD format)
  private formatDateForSubmission(date: Date): string {
    if (!date || !(date instanceof Date)) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private initFormWithData(): void {
    let formGroup: Record<string, any> = {};

    this.formStructure.forEach((control) => {
      const controlValidators = this.getValidators(control);
      let value = this.getExistingValue(control.name);

      console.log(
        `Processing field ${control.name}:`,
        value,
        'Type:',
        control.type
      );

      if (control.type === 'date' && value) {
        value = this.createLocalDate(value);
        console.log(`Date field ${control.name} processed to:`, value);
      } else if (control.type === 'multiselect' && value) {
        if (typeof value === 'string' && value.trim() !== '') {
          const skillsArray = value
            .split(',')
            .map((item: string) => item.trim().toLowerCase())
            .filter((item: string) => item !== '' && item !== 'null');
          value = skillsArray;
        } else if (Array.isArray(value)) {
          value = value
            .filter(
              (item: any) => item !== null && item !== '' && item !== 'null'
            )
            .map((item: any) =>
              typeof item === 'string' ? item.toLowerCase().trim() : item
            );
        } else {
          value = [];
        }
      } else if (control.type === 'checkbox') {
        value =
          typeof value === 'string' ? value.toLowerCase() === 'true' : !!value;
      } else if (control.type === 'radio' && control.name === 'gender') {
        if (typeof value === 'string') {
          value = value.toLowerCase().trim() === 'male';
        } else {
          value = !!value;
        }
      } else if (control.type === 'select' && control.name === 'country') {
        if (typeof value === 'string') {
          const countryMap: { [key: string]: number } = {
            india: 1,
            usa: 2,
            canada: 3,
          };
          value = countryMap[value.toLowerCase().trim()] || 1;
        } else if (typeof value !== 'number') {
          value = 1;
        }
      } else if (control.type === 'number' && value) {
        value = typeof value === 'string' ? parseInt(value) || 0 : value;
      }

      formGroup[control.name] = [
        value !== undefined && value !== null ? value : control.value || '',
        controlValidators,
      ];
    });

    this.dynamicForm = this.fb.group(formGroup);
    console.log('Form initialized with values:', this.dynamicForm.value);
  }

  private getExistingValue(fieldName: string): any {
    if (!this.existingFormData) return null;

    const fieldMapping: { [key: string]: string } = {
      name: 'name',
      description: 'description',
      age: 'age',
      birthday: 'birthday',
      gender: 'gender',
      country: 'country',
      skills: 'skills',
    };

    const backendFieldName = fieldMapping[fieldName] || fieldName;
    const value = this.existingFormData[backendFieldName];

    console.log(
      `Getting value for ${fieldName} (backend: ${backendFieldName}):`,
      value
    );
    return value;
  }

  private getValidators(control: IFormStructure): any[] {
    if (!control.validations || !control.validations.length) return [];

    const validatorFunctions: Record<string, Function> = {
      required: () => Validators.required,
      minLength: (v: number) => Validators.minLength(v),
      maxLength: (v: number) => Validators.maxLength(v),
      pattern: (v: string) => Validators.pattern(v),
      min: (v: number) => Validators.min(v),
      max: (v: number) => Validators.max(v),
    };

    return control.validations
      .map((validation) => {
        const fn = validatorFunctions[validation.validator];
        if (!fn) return null;
        return ['minLength', 'maxLength', 'pattern', 'min', 'max'].includes(
          validation.validator
        )
          ? fn(validation.value)
          : fn();
      })
      .filter((v) => v !== null);
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
    if (!this.formId) {
      console.error('No form ID available for update');
      return;
    }

    if (this.dynamicForm.invalid) {
      console.error('Form is invalid. Cannot submit.');
      this.dynamicForm.markAllAsTouched(); // Mark fields to show errors
      return;
    }

    console.log('Submitting form with ID:', this.formId);
    console.log('Form data before processing:', this.dynamicForm.value);

    this.submitting = true;

    const formDataToSend = { ...this.dynamicForm.value };

    this.formStructure.forEach((control) => {
      if (control.type === 'date' && formDataToSend[control.name]) {
        const dateValue = formDataToSend[control.name];
        if (dateValue instanceof Date) {
          formDataToSend[control.name] =
            this.formatDateForSubmission(dateValue);
          console.log(
            `Date field ${control.name} formatted for submission:`,
            formDataToSend[control.name]
          );
        }
      }
    });

    // Remove excluded fields
    delete formDataToSend.username;
    delete formDataToSend.email;
    delete formDataToSend.password;
    delete formDataToSend.confirmPassword;

    console.log('Final form data to send:', formDataToSend);

    this.formService.updateFormData(this.formId, formDataToSend).subscribe({
      next: (response) => {
        console.log('Form updated successfully:', response);
        this.submitting = false;
        this.router.navigate(['/dashboard', this.formId]);
      },
      error: (error) => {
        console.error('Error updating form:', error);
        this.submitting = false;
      },
    });
  }

  cancel(): void {
    const userId = this.formService.getCurrentUserId();
    this.router.navigate(['/dashboard', userId]);
  }
}
