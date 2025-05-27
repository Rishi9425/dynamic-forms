import { Component, OnInit } from '@angular/core';
import { FormService } from '../service/form-service.service';
import { IFormStructure } from '../domain/forms';
import { ImportsModule } from '../../src/imports'; 
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf, ngFor

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ImportsModule, CommonModule], // Add CommonModule here
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userData: any | null = null;
  loading = true;
  error: string | null = null;
  formStructure: IFormStructure[] = [];

  constructor(private formService: FormService) {}

  ngOnInit(): void {
    this.formService.getFormStructure().then(data => {
      this.formStructure = data;
      this.loadUserData();
    }).catch(err => {
      console.error('Error loading form structure:', err);
      this.error = 'Failed to load form structure.';
      this.loading = false;
    });
  }

  loadUserData(): void {
    const userId = this.formService.getCurrentUserId();
    if (userId) {
      this.formService.getFormByUserId(userId).subscribe({
        next: (data) => {
          this.userData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching user data:', err);
          this.error = 'Failed to load user data. Please try again later.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'No user ID found. Please log in.';
      this.loading = false;
    }
  }

  // Helper to get the display label for options (e.g., gender, country)
  getDisplayValue(fieldName: string, value: any): string {
    const fieldConfig = this.formStructure.find(field => field.name === fieldName);
    if (fieldConfig && fieldConfig.options && Array.isArray(fieldConfig.options)) {
      const option = fieldConfig.options.find(opt => opt.value === value);
      return option ? option.label : value;
    }
    // For multiselect, value might be a comma-separated string from backend
    if (fieldName === 'skills' && typeof value === 'string') {
      const skillLabels = value.split(',').map(skillValue => {
        const matchingOption = fieldConfig?.options?.find(opt => opt.value === skillValue.trim());
        return matchingOption ? matchingOption.label : skillValue.trim();
      });
      return skillLabels.join(', ');
    }
    return value;
  }
}