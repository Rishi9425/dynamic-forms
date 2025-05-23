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
      { field: 'date', header: 'DOB' },
      { field: 'gender', header: 'Gender' },
      { field: 'country', header: 'Country' },
      { field: 'skills', header: 'Skills' },
    ];

    this.loadFormsData();
  }

  loadFormsData() {
    this.loading = true;
    this.formService.getFormsFromBackend().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
        console.log('Forms data loaded:', data);
      },
      error: (error) => {
        console.error('Error loading forms data:', error);
        this.loading = false;
      },
    });
  }

  onUpdate(product: any) {
    const formId = product.id;

    if (!formId) {
      console.error('No ID found for update');
      return;
    }

    // console.log('Updating form with ID:', formId);
    // console.log('Product data:', product);

    this.router.navigate(['/edit', formId]);
  }

  onDelete(product: any) {
    // console.log('Delete clicked:', product);

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
        },
      });
    }
  }

  refreshData() {
    this.loadFormsData();
  }
}
