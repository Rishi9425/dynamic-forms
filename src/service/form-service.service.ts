import { Injectable } from '@angular/core';
import { IFormStructure } from '../domain/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { data } from '../assets/data.json';

@Injectable({
  providedIn: 'root',
})
export class FormService {
  private formtype = data;
  private apiUrl = 'http://localhost:5263/api/forms';

  constructor(private http: HttpClient) {}

  getFormStructure(): Promise<IFormStructure[]> {
    return Promise.resolve(this.formtype);
  }

  getFormsFromBackend(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  submitFormData(formData: any): Observable<any> {
    const transformedData = this.transformFormData(formData);

    console.log('Original form data:', formData);
    console.log('Transformed data for backend:', transformedData);

    return this.http.post<any>(this.apiUrl, transformedData);
  }

  updateFormData(id: number, formData: any): Observable<any> {
    const transformedData = {
      Id: id,
      ...this.transformFormData(formData),
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, transformedData);
  }

  deleteFormData(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  private transformFormData(formData: any): any {
    const transformed: any = {};

    // Get form structure for dynamic processing
    const formStructure = this.formtype;

    for (const field of formStructure) {
      const fieldName = field.name;
      const fieldValue = formData[fieldName];

      // Transform field name to PascalCase for backend
      const backendFieldName = this.toPascalCase(fieldName);

      switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
        case 'textarea':
          transformed[backendFieldName] = fieldValue || '';
          break;

        case 'number':
          transformed[backendFieldName] = this.parseNumber(fieldValue);
          break;

        case 'date':
          transformed[backendFieldName] = this.formatDateForBackend(fieldValue);
          break;

        case 'radio':
          transformed[backendFieldName] = this.convertOptionToString(
            fieldValue,
            field
          );
          break;

        case 'select':
          transformed[backendFieldName] = this.convertOptionToString(
            fieldValue,
            field
          );
          break;

        case 'multiselect':
          transformed[backendFieldName] = this.convertMultiselectToString(
            fieldValue,
            field
          );
          break;

        case 'checkbox':
          transformed[backendFieldName] = Boolean(fieldValue);
          break;

        default:
          transformed[backendFieldName] = fieldValue;
      }
    }

    return transformed;
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  private formatDateForBackend(dateValue: any): string {
    if (!dateValue) return new Date().toISOString().split('T')[0];

    let date: Date;

    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      date = new Date();
    }

    return date.toISOString().split('T')[0];
  }

  private convertOptionToString(value: any, field: IFormStructure): string {
    console.log(`Converting ${field.name}:`, value, typeof value);

    if (!field.options || field.options.length === 0) {
      return String(value || '');
    }

    // Find the option that matches the value
    const matchingOption = field.options.find(
      (option) =>
        option.value === value || String(option.value) === String(value)
    );

    if (matchingOption) {
      return matchingOption.label;
    }

    // If no match found, try to find by label (case insensitive)
    if (typeof value === 'string') {
      const matchingByLabel = field.options.find(
        (option) => option.label.toLowerCase() === value.toLowerCase()
      );
      if (matchingByLabel) {
        return matchingByLabel.label;
      }
    }

    // Return default (first option) if no match found
    return field.options[0]?.label || String(value || '');
  }

  private convertMultiselectToString(
    value: any,
    field: IFormStructure
  ): string {
    if (!value || !field.options || field.options.length === 0) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      const labels = value.map((val) => {
        const matchingOption = field.options!.find(
          (option) =>
            option.value === val || String(option.value) === String(val)
        );
        return matchingOption ? matchingOption.label : String(val);
      });
      return labels.join(',');
    }

    return String(value);
  }

  getFieldConfig(fieldName: string): IFormStructure | undefined {
    return this.formtype.find((field) => field.name === fieldName);
  }

  getFieldOptions(fieldName: string): Array<{ label: string; value: any }> {
    const field = this.getFieldConfig(fieldName);
    return field?.options || [];
  }

  // Helper method to get default value for a field
  getFieldDefaultValue(fieldName: string): any {
    const field = this.getFieldConfig(fieldName);
    return field?.value;
  }
}
