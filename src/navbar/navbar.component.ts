import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Ripple } from 'primeng/ripple';
import { Menubar } from 'primeng/menubar';
import { FormService } from '../service/form-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [Menubar, BadgeModule, AvatarModule, InputTextModule, Ripple, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
    userData: any | null = null;
  items: MenuItem[] | undefined;
   error: string | null = null;
  loading = true;
  isLoggedIn = false;
  username = '';
  toggleUserDropdown = false;

  constructor(private formService: FormService, private router: Router) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.loadUserData();
  }
  loadUserData(): void {
    const Id = this.formService.getCurrentUserId();
    if (Id) {
      this.formService.getFormByUserId(Id).subscribe({
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
    } else {
      this.error = 'No user ID found. Please log in.';
      this.loading = false;
      // Optionally redirect to login if no user ID is found
      // this.router.navigate(['/login']);
    }
  }
  checkLoginStatus() {
    this.isLoggedIn = this.formService.isAuthenticated();
    if (this.isLoggedIn) {
      // Get username from the service instead of directly from localStorage
      this.username = this.formService.getUsername() || 'User';
    } else {
      this.username = '';
    }
    console.log(this.username);
    console.log(this.userInitial);
  }

  get userInitial(): string {
    // Use the service method to get the user initial
    return this.formService.getUserInitial();
  }

  onLogout() {
    this.formService.clearToken(); // This now also clears the username
    this.isLoggedIn = false;
    this.username = '';
    this.toggleUserDropdown = false;
    this.router.navigate(['/']);
  }

  onEditPassword() {
   const userId = this.formService.getCurrentUserId();
    if (userId) {
      this.router.navigate(['/Update-password', userId]);
    } else {
      console.warn('User ID not found for profile update.');
    }
    this.toggleUserDropdown = false;
  }

  onUpdateProfile() {
    const userId = this.formService.getCurrentUserId();
    if (userId) {
      this.router.navigate(['/edit', userId]);
    } else {
      console.warn('User ID not found for profile update.');
    }
    this.toggleUserDropdown = false;
  }

  auth() {
    this.router.navigate(['/']);
  }
  
  onDelete(): void {
    if (this.userData && this.userData.id) {
      // Replaced window.confirm with a console log as window.confirm is not allowed in canvas
      console.log('Confirm deletion of user data.');
      // In a real application, you would use a PrimeNG ConfirmDialog or similar modal here.
      // For now, assuming user confirms, proceed with deletion.
      // if (confirm('Are you sure you want to delete your data?')) { // Original line
      this.loading = true;
      this.formService.deleteFormData(this.userData.id).subscribe({
        next: () => {
          this.userData = null;
          this.loading = false;
          // Replaced alert with a console log as window.alert is not allowed in canvas
          console.log('Your data has been deleted.');
          // In a real app, you would show a PrimeNG Message or Toast
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Failed to delete user data. Please try again later.';
          console.error('Delete failed:', err);
        },
      });
      // } // End of original confirm block
    }
     this.formService.clearToken(); // This now also clears the username
    this.isLoggedIn = false;
    this.username = '';
    this.toggleUserDropdown = false;
    this.router.navigate(['/']);
  }
}