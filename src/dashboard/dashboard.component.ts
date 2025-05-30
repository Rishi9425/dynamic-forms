import { Component, OnInit } from '@angular/core';
import { FormService } from '../service/form-service.service';
import { IFormStructure } from '../domain/forms';
import { ImportsModule } from '../../src/imports';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ImportsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  userData: any | null = null;
  loading = true;
  error: string | null = null;
  formStructure: IFormStructure[] = [];

  constructor(private formService: FormService, private router: Router) {}

  ngOnInit(): void {
    this.formService
      .getFormStructure()
      .then((data) => {
        this.formStructure = data;
        this.loadUserDataWithRetry();
      })
      .catch((err) => {
        console.error('Error loading form structure:', err);
        this.error = 'Failed to load form structure.';
        this.loading = false;
      });
  }

  loadUserDataWithRetry(
    maxRetries: number = 3,
    currentRetry: number = 0
  ): void {
    const userId = this.formService.getCurrentUserId();

    if (userId) {
      this.loadUserData(userId);
    } else if (currentRetry < maxRetries) {
      setTimeout(() => {
        this.loadUserDataWithRetry(maxRetries, currentRetry + 1);
      }, 100 * (currentRetry + 1));
    } else {
      this.error = 'No user ID found. Please log in.';
      this.loading = false;
    }
  }

  loadUserData(userId: number): void {
    this.formService.getFormByUserId(userId).subscribe({
      next: (data) => {
        this.userData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching user data:', err);
        this.error = 'Failed to load user data. Please try again later.';
        this.loading = false;
      },
    });
  }

  getDisplayValue(fieldName: string, value: any): string {
    const fieldConfig = this.formStructure.find(
      (field) => field.name === fieldName
    );
    if (
      fieldConfig &&
      fieldConfig.options &&
      Array.isArray(fieldConfig.options)
    ) {
      const option = fieldConfig.options.find((opt) => opt.value === value);
      return option ? option.label : value;
    }
    // For multiselect, value might be a comma-separated string from backend
    if (fieldName === 'skills' && typeof value === 'string') {
      const skillLabels = value.split(',').map((skillValue) => {
        const matchingOption = fieldConfig?.options?.find(
          (opt) => opt.value === skillValue.trim()
        );
        return matchingOption ? matchingOption.label : skillValue.trim();
      });
      return skillLabels.join(', ');
    }
    return value;
  }

  Nouser() {
    this.router.navigate(['/login']);
  }

  refreshComponent() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
}
