import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormService } from '../service/form-service.service';
import { ImportsModule } from './imports';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ImportsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    this.loading = true;
    this.errorMessage = ''; // Clear any previous error messages
    
    this.formService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        this.loading = false;
        
        // The FormService already handles setting the token and userId
        // Just get the current user ID from the service
        const currentUserId = this.formService.getCurrentUserId();
        
        if (currentUserId && currentUserId > 0) {
          console.log('Navigating to dashboard with user ID:', currentUserId);
          this.router.navigate(['/dashboard', currentUserId]);
        } else {
          console.error('No valid user ID found after login');
          this.errorMessage = 'Login successful but user ID not found. Please try again.';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Invalid email or password';
        console.error('Login failed:', error);
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}