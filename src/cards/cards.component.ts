import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormService } from '../service/form-service.service';

interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [TableModule, CommonModule],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss'],
})
export class CardsComponent implements OnInit {
  cols!: Column[];
  products: any[] = [];
  loading: boolean = false;

  constructor(private formService: FormService, private router: Router) {}

  ngOnInit() {
    this.cols = [
      { field: 'name', header: 'Name' },
      { field: 'email', header: 'Email' },
      { field: 'description', header: 'Description' },
      { field: 'age', header: 'Age' },
      { field: 'birthday', header: 'DOB' }, // Changed from 'date' to 'birthday' to match backend
      { field: 'gender', header: 'Gender' },
      { field: 'country', header: 'Country' },
      { field: 'skills', header: 'Skills' },
      // Note: Password is not included in display columns for security
    ];

    // Check authentication before loading data
    if (!this.formService.isAuthenticated()) {
      console.warn('User not authenticated, redirecting to login');
      // Uncomment the next line if you have a login route
      // this.router.navigate(['/login']);
      return;
    }

    this.loadFormsData();
  }

  loadFormsData() {
    this.loading = true;
    this.formService.getFormsFromBackend().subscribe({
      next: (data) => {
        // Filter out password field from display data for security
        this.products = data.map(item => {
          const { password, ...displayData } = item;
          return displayData;
        });
        this.loading = false;
        console.log('Forms data loaded:', this.products);
      },
      error: (error) => {
        console.error('Error loading forms data:', error);
        this.loading = false;
        
        // Handle authentication errors
        if (error.status === 401) {
          console.error('Authentication failed. Token may be expired or invalid.');
          this.formService.clearToken();
          // Uncomment the next line if you have a login route
          // this.router.navigate(['/login']);
        }
      },
    });
  }

  onUpdate(product: any) {
    const formId = product.id;

    if (!formId) {
      console.error('No ID found for update');
      return;
    }

    this.router.navigate(['/edit', formId]);
  }

  onDelete(product: any) {
    const id = product.id;

    if (!id) {
      console.error('No ID found for deletion');
      return;
    }

    if (confirm('Are you sure you want to delete this form?')) {
      this.formService.deleteFormData(id).subscribe({
        next: (response) => {
          console.log('Form deleted successfully:', response);
          this.loadFormsData();
        },
        error: (error) => {
          console.error('Error deleting form:', error);
          if (error.status === 401) {
            console.error('Authentication failed during deletion.');
            this.formService.clearToken();
            // Uncomment the next line if you have a login route
            // this.router.navigate(['/login']);
          }
        },
      });
    }
  }

  refreshData() {
    this.loadFormsData();
  }
}