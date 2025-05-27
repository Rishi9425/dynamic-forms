import { Injectable } from '@angular/core';
import { IFormStructure } from '../domain/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { data } from '../assets/data.json';

@Injectable({
  providedIn: 'root',
})
export class FormService {
  private formtype = data;
  private apiUrl = 'https://localhost:5263/api/forms';
  private token: string | null = null;
  private currentUserId: string | null = null;

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem('jwt_token');
    this.currentUserId = localStorage.getItem('current_user_id');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('jwt_token', token);
  }

  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
    localStorage.setItem('current_user_id', userId);
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  clearToken(): void {
    this.token = null;
    this.currentUserId = null;
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user_id');
  }

  private getAuthHeaders(): HttpHeaders {
    if (this.token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.currentUserId; // Check both token and userId for authentication
  }

  getFormStructure(): Promise<IFormStructure[]> {
    return Promise.resolve(this.formtype);
  }

  getFormsFromBackend(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getFormByUserId(userId: string): Observable<any> {
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
        console.error('Invalid user ID provided for getFormByUserId:', userId);
        return new Observable(observer => observer.error('Invalid user ID'));
    }
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Modified submitFormData to ensure userId is captured
  submitFormData(formData: any): Observable<any> {
    const transformedData = this.transformFormData(formData);

    console.log('Original form data:', formData);
    console.log('Transformed data for backend:', transformedData);

    // Register first
    return this.http.post<any>(`${this.apiUrl}/register`, transformedData).pipe(
      // The tap here will capture the 'id' from the registration response
      tap(registerResponse => {
        if (registerResponse.id) {
          this.setCurrentUserId(registerResponse.id.toString());
          console.log('User ID stored from registration:', registerResponse.id);
        }
      }),
      // Then immediately try to log in with the provided credentials
      switchMap(registerResponse => {
        console.log('Registration successful, attempting auto-login.');
        const loginCredentials = {
          email: formData.email,
          password: formData.password
        };
        return this.login(loginCredentials); // This 'login' call already sets token and userId
      })
    );
  }

  // Modified login to ensure userId is captured
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.token) {
          this.setToken(response.token);
          console.log('Token set from login response.');
        }
        // This is crucial: check for 'userId' from the backend's login response
        const receivedUserId = response.userId || response.id || response.user?.id;
        if (receivedUserId) {
          this.setCurrentUserId(receivedUserId.toString());
          console.log('User ID stored from login response:', receivedUserId);
        } else {
          console.warn('Login response did not contain a user ID (userId, id, or user.id).');
        }
      })
    );
  }

  // registerAndLogin method is now redundant as submitFormData handles this.
  // You can remove it or keep it if you have other use cases.
  registerAndLogin(formData: any): Observable<any> {
    const transformedData = this.transformFormData(formData);

    return this.http.post<any>(`${this.apiUrl}/register`, transformedData).pipe(
      tap((registerResponse) => {
        if (registerResponse.id) {
          this.setCurrentUserId(registerResponse.id.toString());
        }
      }),
      switchMap((registerResponse) => {
        const loginCredentials = {
          email: formData.email,
          password: formData.password
        };

        return this.login(loginCredentials);
      })
    );
  }

  updateFormData(id: number, formData: any): Observable<any> {
    const transformedData = {
      Id: id,
      ...this.transformFormData(formData),
    };
    return this.http.put<any>(`${this.apiUrl}/${id}`, transformedData, {
      headers: this.getAuthHeaders()
    });
  }

  deleteFormData(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  private transformFormData(formData: any): any {
    const transformed: any = {};

    const fieldMappings: { [key: string]: string } = {
      'name': 'Name',
      'email': 'Email',
      'description': 'Description',
      'birthday': 'Birthday',
      'gender': 'Gender',
      'age': 'Age',
      'country': 'Country',
      'skills': 'Skills',
      'password': 'Password'
    };

    for (const [angularField, backendField] of Object.entries(fieldMappings)) {
      const fieldValue = formData[angularField];
      const fieldConfig = this.getFieldConfig(angularField);

      if (fieldValue !== undefined && fieldValue !== null) {
        switch (fieldConfig?.type) {
          case 'text':
          case 'email':
          case 'password':
          case 'textarea':
            transformed[backendField] = String(fieldValue || '');
            break;

          case 'number':
            transformed[backendField] = this.parseNumber(fieldValue);
            break;

          case 'date':
            transformed[backendField] = this.formatDateForBackend(fieldValue);
            break;

          case 'radio':
          case 'select':
            transformed[backendField] = this.convertOptionToString(fieldValue, fieldConfig);
            break;

          case 'multiselect':
            transformed[backendField] = this.convertMultiselectToString(fieldValue, fieldConfig);
            break;

          case 'checkbox':
            transformed[backendField] = Boolean(fieldValue);
            break;

          default:
            transformed[backendField] = fieldValue;
            break;
        }
      }
    }
    return transformed;
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

    if (isNaN(date.getTime())) {
      date = new Date();
    }

    return date.toISOString().split('T')[0];
  }

  private convertOptionToString(value: any, field: IFormStructure): string {
    if (!field.options || field.options.length === 0) {
      return String(value || '');
    }

    const matchingOption = field.options.find(
      (option) => option.value === value || String(option.value) === String(value)
    );

    if (matchingOption) {
      return matchingOption.label;
    }

    if (typeof value === 'string') {
      const matchingByLabel = field.options.find(
        (option) => option.label.toLowerCase() === value.toLowerCase()
      );
      if (matchingByLabel) {
        return matchingByLabel.label;
      }
    }
    return '';
  }

  private convertMultiselectToString(value: any, field: IFormStructure): string {
    if (!value || !field.options || field.options.length === 0) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      const labels = value.map((val) => {
        const matchingOption = field.options!.find(
          (option) => option.value === val || String(option.value) === String(val)
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

  getFieldDefaultValue(fieldName: string): any {
    const field = this.getFieldConfig(fieldName);
    return field?.value;
  }

  getFormById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}