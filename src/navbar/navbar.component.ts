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
  items: MenuItem[] | undefined;
  isLoggedIn = false;
  username = '';
  toggleUserDropdown = false;

  constructor(private formService: FormService, private router: Router) {}

  ngOnInit() {
    this.checkLoginStatus();
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
    console.log('Navigate to Edit Password');
   this.router.navigate(['/change-password' ]);
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
}