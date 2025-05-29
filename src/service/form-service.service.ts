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
  private username: string | null = null;

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem('jwt_token');
    this.currentUserId = localStorage.getItem('current_user_id');
    this.username = localStorage.getItem('username'); 
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('jwt_token', token);
  }

  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
    localStorage.setItem('current_user_id', userId);
  }

  // Add method to set username
  setUsername(Username: string): void {
    this.username = Username;
    localStorage.setItem('username', Username);
    console.log(Username);
  }

  // Add method to get username
  getUsername(): string | null {
    return this.username || localStorage.getItem('username');
  }

  // Add method to get first letter of username
  getUserInitial(): string {
    const currentUsername = this.getUsername();
    return currentUsername ? currentUsername.charAt(0).toUpperCase() : '';
  }

  getToken(): string | null {
    return this.token;
  }

  getCurrentUserId(): number {
    return this.currentUserId ? Number(this.currentUserId) : 0;
  }

  clearToken(): void {
    this.token = null;
    this.currentUserId = null;
    this.username = null; 
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('username');
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
    return !!this.token && !!this.currentUserId;
  }

  // New method for editing password with current password verification
  editPassword(userId: number, passwordData: { 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string 
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/Update-password/${userId}`, passwordData, {
      headers: this.getAuthHeaders()
    });
  }

  // Existing method for changing password (keep for backward compatibility)
  forgotpassword(passwordData: { email: string; newPassword: string; confirmPassword: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/forgot-password`, passwordData, {
    });
  }

  getFormStructure(): Promise<IFormStructure[]> {
    return Promise.resolve(this.formtype);
  }

  getFormsFromBackend(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getFormByUserId(Id: number): Observable<any> {
    if (isNaN(Id)) {
      console.error('Invalid user ID provided for getFormByUserId:', Id);
      return new Observable(observer => observer.error('Invalid user ID'));
    }
    return this.http.get<any>(`${this.apiUrl}/${Id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Updated register method - only requires username, email, password, and optional name
  register(registrationData: { username: string; email: string; password: string; name?: string }): Observable<any> {
    console.log('Registration data:', registrationData);
    return this.http.post<any>(`${this.apiUrl}/register`, registrationData);
  }

  // Updated login method - uses username instead of email
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.token) {
          this.setToken(response.token);
          console.log('Token set from login response.');
        }
        
        if (response.userId) {
          this.setCurrentUserId(response.userId.toString());
          console.log('User ID stored from login response:', response.userId);
        } else {
          console.warn('Login response did not contain a user ID.');
        }

        // Store username from login response or use the credentials username
        if (response.username) {
          this.setUsername(response.username);
          console.log('Username stored from login response:', response.username);
        } else {
          this.setUsername(credentials.username);
          console.log('Username stored from login credentials:', credentials.username);
        }
      })
    );
  }

  // Updated registerAndLogin method
  registerAndLogin(registrationData: { username: string; email: string; password: string; name?: string }): Observable<any> {
    return this.register(registrationData).pipe(
      tap((registerResponse) => {
        if (registerResponse.id) {
          this.setCurrentUserId(registerResponse.id.toString());
          console.log('User ID stored from registration:', registerResponse.id);
        }
        // Store username from registration
        if (registerResponse.username || registrationData.username) {
          this.setUsername(registerResponse.username || registrationData.username);
          console.log('Username stored from registration:', registerResponse.username || registrationData.username);
        }
      }),
      switchMap((registerResponse) => {
        const loginCredentials = {
          username: registrationData.username,
          password: registrationData.password
        };
        return this.login(loginCredentials);
      })
    );
  }


  submitFormData(formData: any): Observable<any> {
  
    const registrationData = {
      username: formData.username || formData.email, 
      email: formData.email,
      password: formData.password,
      name: formData.name
    };

    return this.registerAndLogin(registrationData);
  }

  updateFormData(id: number, formData: any): Observable<any> {
    const transformedData = {
      Id: id,
      ...this.transformFormData(formData, ['username', 'email']), // exclude these fields
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, transformedData, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteFormData(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  private transformFormData(formData: any, excludeFields: string[] = []): any {
  const transformed: any = {};

  const fieldMappings: { [key: string]: string } = {
    'username': 'Username',
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
    if (excludeFields.includes(angularField)) continue;

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