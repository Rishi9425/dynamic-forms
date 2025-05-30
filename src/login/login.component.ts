// login.component.ts
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { FormService } from '../service/form-service.service';
import { ImportsModule } from './imports'; // Assuming this path is correct

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ImportsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  isLoginMode = true;

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', Validators.required],
    });

    this.registerForm = this.fb.group(
      {
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.pattern(/^[a-zA-Z0-9_]+$/),
          ],
        ],
        name: [''],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
      return null;
    }
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.clearMessages();
    this.resetForms();
  }

  private resetForms(): void {
    this.loginForm.reset();
    this.registerForm.reset();
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.clearMessages();

    this.formService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        this.loading = false;
        const currentUserId = this.formService.getCurrentUserId();
        if (currentUserId) {
          console.log('Navigating to dashboard with user ID:', currentUserId);
          this.router.navigate(['Home-Page']);
        } else {
          console.error('No valid user ID found after login.');
          this.errorMessage =
            'Login successful but user ID not found. Please try again.';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Login failed:', error);
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Invalid username or password';
        }
      },
    });
  }
  onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.clearMessages();

    const registrationData = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      name: this.registerForm.value.name || null,
    };

    console.log('Registration data:', registrationData);

    this.formService.registerAndLogin(registrationData).subscribe({
      next: (response) => {
        console.log('Registration and login response:', response);
        this.loading = false;
        this.successMessage =
          'Registration successful! Redirecting to HomePage...';
        const currentUserId = this.formService.getCurrentUserId();
        if (currentUserId && currentUserId > 0) {
          this.router.navigate(['/Home-Page']);
        } else {
          console.error('Registration successful but user ID not found.');
          this.successMessage =
            'Registration successful! Please login to continue.';
          this.isLoginMode = true;
          this.resetForms();
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Registration failed:', error);

        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 400) {
          this.errorMessage =
            'Username or email already exists, or invalid data provided.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      },
    });
  }

  onSubmit(): void {
    if (this.isLoginMode) {
      this.onLoginSubmit();
    } else {
      this.onRegisterSubmit();
    }
  }

  goToRegister(): void {
    this.isLoginMode = false;
    this.clearMessages();
    this.resetForms();
  }

  forgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
