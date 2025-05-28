import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ImportsModule } from './imports';
import { IFormStructure } from '../domain/forms';
import { FormService } from '../service/form-service.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Calendar } from 'primeng/calendar';

@Component({
  selector: 'app-edit-form-component',
  standalone: true,
  imports: [ImportsModule, RouterModule, Calendar],
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
        this.formStructure = data.filter(control => control.name !== 'username' && control.name !== 'email' && control.name !== 'password' && control.name !== 'confirmPassword');
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
        value = new Date(value);
      } else if (control.type === 'multiselect' && value) {
        if (typeof value === 'string') {
          value = value.split(',').map((item: string) => item.trim());
        } else if (!Array.isArray(value)) {
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
      // Note: 'username' and 'email' are not in this mapping if we want to exclude them from the editable form
      name: 'name',
      description: 'description',
      age: 'age',
      birthday: 'birthday', // Assuming your backend returns 'birthday' as is
      gender: 'gender',
      country: 'country',
      skills: 'skills',
      // password is not included here as it's not meant for direct update in this form
    };

    const backendFieldName = fieldMapping[fieldName] || fieldName; // Fallback to fieldName if not mapped
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
    console.log('Form data:', this.dynamicForm.value);

    this.submitting = true;
    
    // Create a new object to send, excluding username and email
    const formDataToSend = { ...this.dynamicForm.value };
    delete formDataToSend.username; // Exclude username
    delete formDataToSend.email;    // Exclude email
    delete formDataToSend.password; // Exclude password if present
    delete formDataToSend.confirmPassword; // Exclude confirmPassword if present

    this.formService.updateFormData(this.formId, formDataToSend).subscribe({
      next: (response) => {
        console.log('Form updated successfully:', response);
        this.submitting = false;
        this.router.navigate(['/dashboard', this.formId]);
      },
      error: (error) => {
        console.error('Error updating form:', error);
        this.submitting = false;
        // Optionally display an error message to the user
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/cards']); // Or navigate to dashboard or previous page
  }
}