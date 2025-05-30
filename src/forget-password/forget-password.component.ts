
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormService} from '../service/form-service.service';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';

@Component({
  selector: 'app-edit-password',
  imports: [  CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    MessageModule,
    MessagesModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export class forgetPasswordComponent {
changePasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private router: Router,
   
  ) {
    this.changePasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMatch: true });
      return { passwordMatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMatch')) {
      delete confirmPassword.errors!['passwordMatch'];
      if (Object.keys(confirmPassword.errors!).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.changePasswordForm.value;
      
      this.formService.forgotpassword({
        email: formData.email,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      }).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Password changed successfully! Redirecting to login...';
          
          // Clear user session and redirect to login after a short delay
          setTimeout(() => {
            this.formService.clearToken();
            this.router.navigate(['/']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to change password. Please try again.';
          console.error('Password change error:', error);
        }
      });
    }
  }

  onCancel() {
      this.router.navigate(['/']);
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
}
