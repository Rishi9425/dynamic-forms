// login.component.ts
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  private returnUrl: string = '/Home-Page';

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.handleReturnUrl();
    this.checkIfAlreadyAuthenticated();
  }

  private handleReturnUrl(): void {
    // Get the return URL from route parameters or default to home page
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/Home-Page';
    
    // Clean up the return URL if it's pointing to login or root
    if (this.returnUrl === '/login' || this.returnUrl === '/') {
      this.returnUrl = '/Home-Page';
    }
  }

  private checkIfAlreadyAuthenticated(): void {
    // If user is already authenticated, redirect to home page
    if (this.formService.isAuthenticated()) {
      this.router.navigate(['/Home-Page'], { replaceUrl: true });
    }
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
        password: ['', [Validators.required, Validators.minLength(8),
          Validators.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    ),
        ]],
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
        
        // Check if authentication was successful
        if (this.formService.isAuthenticated()) {
          console.log('Login successful, navigating to:', this.returnUrl);
          // Navigate to the return URL or home page, replace current history entry
          this.router.navigate([this.returnUrl], { replaceUrl: true });
        } else {
          console.error('Login response received but authentication failed.');
          this.errorMessage = 'Login failed. Please try again.';
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
        
        // Check if authentication was successful after registration
        if (this.formService.isAuthenticated()) {
          this.successMessage = 'Registration successful! Redirecting to HomePage...';
          console.log('Registration successful, navigating to Home-Page');
          // Navigate to home page after successful registration, replace current history entry
          this.router.navigate(['/Home-Page'], { replaceUrl: true });
        } else {
          console.error('Registration successful but authentication failed.');
          this.successMessage = 'Registration successful! Please login to continue.';
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