import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormService } from '../service/form-service.service';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-edit-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    MessagesModule,
    MessageModule
  ],
  templateUrl: './edit-password.component.html',
  styleUrls: ['./edit-password.component.scss']
})
export class UpdatePasswordComponent implements OnInit {
  editPasswordForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentUserId: number = 0;

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getCurrentUserId();
  }

  private initializeForm(): void {
    this.editPasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private getCurrentUserId(): void {
    this.currentUserId = this.formService.getCurrentUserId();
    if (!this.currentUserId || this.currentUserId === 0) {
      this.errorMessage = 'User not authenticated. Please login again.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.editPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.currentUserId || this.currentUserId === 0) {
      this.errorMessage = 'User not authenticated. Please login again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.editPasswordForm.value;
    const passwordData = {
      currentPassword: formValue.currentPassword,
      newPassword: formValue.newPassword,
      confirmPassword: formValue.confirmPassword
    };

    this.formService.editPassword(this.currentUserId, passwordData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Password updated successfully!';
        this.editPasswordForm.reset();
        
        // Optionally redirect after successful password change
        setTimeout(() => {
           const userId = this.formService.getCurrentUserId();
          this.router.navigate(['/dashboard',userId]); // or wherever you want to redirect
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'An error occurred while updating password. Please try again.';
        }
        console.error('Password edit error:', error);
      }
    });
  }

  onCancel(): void {
    this.editPasswordForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
    const userId = this.formService.getCurrentUserId();
          this.router.navigate(['/dashboard',userId]); // or go back to previous page
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editPasswordForm.controls).forEach(key => {
      const control = this.editPasswordForm.get(key);
      control?.markAsTouched();
    });
  }
getMessages() {
    const messages = [];
    if (this.errorMessage) {
      messages.push({ severity: 'error', summary: 'Error', detail: this.errorMessage });
    }
    if (this.successMessage) {
      messages.push({ severity: 'success', summary: 'Success', detail: this.successMessage });
    }
    return messages;
  }
  // Helper methods for form validation display
  isFieldInvalid(fieldName: string): boolean {
    const field = this.editPasswordForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.editPasswordForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (field.errors['minlength']) {
      const requiredLength = field.errors['minlength'].requiredLength;
      return `${this.getFieldDisplayName(fieldName)} must be at least ${requiredLength} characters long`;
    }
    return '';
  }

  getConfirmPasswordError(): string {
    const confirmPasswordField = this.editPasswordForm.get('confirmPassword');
    if (!confirmPasswordField || !confirmPasswordField.touched) {
      return '';
    }

    if (confirmPasswordField.errors?.['required']) {
      return 'Confirm password is required';
    }
    
    if (this.editPasswordForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }

    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'currentPassword': 'Current password',
      'newPassword': 'New password',
      'confirmPassword': 'Confirm password'
    };
    return displayNames[fieldName] || fieldName;
  }
}