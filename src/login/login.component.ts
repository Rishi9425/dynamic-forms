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
    this.formService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.token) {
          this.formService.setToken(response.token);
        }
        if (response.userId || response.id || response.user?.id) {
          const userId = response.userId || response.id || response.user.id;
          this.router.navigate(['/cards', userId]);
        } else {
          this.router.navigate(['/cards']);
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