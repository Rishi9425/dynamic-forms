import { Injectable } from '@angular/core';
import { IFormStructure } from '../domain/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { data } from '../assets/data.json'; 
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FormService {
  private authStatusSubject = new BehaviorSubject<boolean>(
    this.isAuthenticated()
  );
  public authStatusChanged = this.authStatusSubject.asObservable();
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

  setUsername(Username: string): void {
    this.username = Username;
    localStorage.setItem('username', Username);
    console.log(Username);
  }

  getUsername(): string | null {
    return this.username || localStorage.getItem('username');
  }

  getUserInitial(): string {
    const currentUsername = this.getUsername();
    return currentUsername ? currentUsername.charAt(0).toUpperCase() : '';
  }

  getToken(): string | null {
    return this.token;
  }

  getCurrentUserId(): number {
    return Number(this.currentUserId) ? Number(this.currentUserId) : 0;
  }

  private updateAuthStatus(): void {
  this.authStatusSubject.next(this.isAuthenticated());
}

// Update your setToken method
setToken(token: string): void {
  this.token = token;
  localStorage.setItem('jwt_token', token);
  this.updateAuthStatus(); 
}


setCurrentUserId(userId: string): void {
  this.currentUserId = userId;
  localStorage.setItem('current_user_id', userId);
   this.updateAuthStatus(); 
}

// Update your clearToken method
clearToken(): void {
  this.token = null;
  this.currentUserId = null;
  this.username = null;
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('current_user_id');
  localStorage.removeItem('username');
  this.updateAuthStatus(); 
}

// Add a logout method for better organization
logout(): void {
  this.clearToken();
}

// Enhanced isAuthenticated method with better validation
isAuthenticated(): boolean {
  const token = this.token || localStorage.getItem('jwt_token');
  const userId = this.currentUserId || localStorage.getItem('current_user_id');
  return !!(token && userId);
}



  private getAuthHeaders(): HttpHeaders {
    if (this.token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  editPassword(
    userId: number,
    passwordData: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/Update-password/${userId}`,
      passwordData,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  forgotpassword(passwordData: {
    email: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/forgot-password`,
      passwordData,
      {}
    );
  }

  getFormStructure(): Promise<IFormStructure[]> {
    return Promise.resolve(this.formtype);
  }

  getFormsFromBackend(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  getFormByUserId(Id: number): Observable<any> {
    if (isNaN(Id)) {
      console.error('Invalid user ID provided for getFormByUserId:', Id);
      return new Observable((observer) => observer.error('Invalid user ID'));
    }
    return this.http.get<any>(`${this.apiUrl}/${Id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  register(registrationData: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }): Observable<any> {
    console.log('Registration data:', registrationData);
    return this.http.post<any>(`${this.apiUrl}/register`, registrationData);
  }

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

        if (response.username) {
          this.setUsername(response.username);
          console.log(
            'Username stored from login response:',
            response.username
          );
        } else {
          this.setUsername(credentials.username);
          console.log(
            'Username stored from login credentials:',
            credentials.username
          );
        }
      })
    );
  }

  registerAndLogin(registrationData: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }): Observable<any> {
    return this.register(registrationData).pipe(
      tap((registerResponse) => {
        if (registerResponse.id) {
          this.setCurrentUserId(registerResponse.id.toString());
          console.log('User ID stored from registration:', registerResponse.id);
        }
        if (registerResponse.username || registrationData.username) {
          this.setUsername(
            registerResponse.username || registrationData.username
          );
          console.log(
            'Username stored from registration:',
            registerResponse.username || registrationData.username
          );
        }
      }),
      switchMap((registerResponse) => {
        const loginCredentials = {
          username: registrationData.username,
          password: registrationData.password,
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
      name: formData.name,
    };

    return this.registerAndLogin(registrationData);
  }

  updateFormData(id: number, formData: any): Observable<any> {
    // Ensure profileImageBase64 is part of the transformed data
    const transformedData = {
      Id: id,
      ...this.transformFormData(formData, ['username', 'email']), 
      ProfileImageBase64: formData.profileImageBase64 || null, 
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, transformedData, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteFormData(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  private transformFormData(formData: any, excludeFields: string[] = []): any {
    const transformed: any = {};

    const fieldMappings: { [key: string]: string } = {
      username: 'Username',
      name: 'Name',
      email: 'Email',
      description: 'Description',
      birthday: 'Birthday',
      gender: 'Gender',
      age: 'Age',
      country: 'Country',
      skills: 'Skills',
      password: 'Password',
      profileImageBase64: 'ProfileImageBase64',
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
            transformed[backendField] = this.convertOptionToString(
              fieldValue,
              fieldConfig
            );
            break;

          case 'multiselect':
            transformed[backendField] = this.convertMultiselectToString(
              fieldValue,
              fieldConfig
            );
            break;

          case 'checkbox':
            transformed[backendField] = Boolean(fieldValue);
            break;

          default:
            // For profileImageBase64, directly assign it if it's not a form field type
            if (angularField === 'profileImageBase64') {
              transformed[backendField] = fieldValue;
            } else {
              transformed[backendField] = fieldValue;
            }
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

    // Special handling for country field (return value, not label)
    if (field.name === 'country') {
      if (typeof value === 'number') {
        const option = field.options[value - 1]; // Assuming 1-based indexing
        return option ? String(option.value) : '';
      }

      if (typeof value === 'string' && !isNaN(parseInt(value))) {
        const numValue = parseInt(value);
        const option = field.options[numValue - 1];
        return option ? String(option.value) : '';
      }
    }

    const matchingOption = field.options.find(
      (option) =>
        option.value === value || String(option.value) === String(value)
    );

    if (matchingOption) {
      return String(matchingOption.value); // Return the value, not the label, for backend storage
    }

    if (typeof value === 'string') {
      const matchingByLabel = field.options.find(
        (option) => option.label.toLowerCase() === value.toLowerCase()
      );
      if (matchingByLabel) {
        return String(matchingByLabel.value); // Return the value, not the label
      }
    }
    return String(value || ''); // Default to string representation of the value
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
      const values = value.map((val) => {
        const matchingOption = field.options!.find(
          (option) =>
            option.value === val || String(option.value) === String(val)
        );
        return matchingOption ? String(matchingOption.value) : String(val); // Store values, not labels
      });
      return values.join(',');
    }

    return String(value);
  }

  getFieldConfig(fieldName: string): IFormStructure | undefined {
    return this.formtype.find((field) => field.name === fieldName);
  }

  getFormById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}