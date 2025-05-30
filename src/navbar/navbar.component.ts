import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Ripple } from 'primeng/ripple';
import { Menubar } from 'primeng/menubar';
import { FormService } from '../service/form-service.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    Menubar,
    BadgeModule,
    AvatarModule,
    InputTextModule,
    Ripple,
    CommonModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {
  userData: any | null = null;
  items: MenuItem[] | undefined;
  error: string | null = null;
  loading = true;
  isLoggedIn = false;
  username = '';
  toggleUserDropdown = false;
  private routerSubscription: Subscription = new Subscription();
  private authSubscription: Subscription = new Subscription();

  constructor(private formService: FormService, private router: Router) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.loadUserData();
    this.setupAuthSubscription();
    this.setupRouterSubscription();
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  setupAuthSubscription() {
    this.authSubscription = this.formService.authStatusChanged?.subscribe(
      () => {
        this.refreshNavbar();
      }
    );
  }

  // Setup router subscription to refresh navbar on route changes
  setupRouterSubscription() {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Check if login status changed after navigation
        const currentLoginStatus = this.formService.isAuthenticated();
        if (currentLoginStatus !== this.isLoggedIn) {
          this.refreshNavbar();
        }
      });
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
    }
  }

  checkLoginStatus() {
    this.isLoggedIn = this.formService.isAuthenticated();
    if (this.isLoggedIn) {
      this.username = this.formService.getUsername() || 'User';
    } else {
      this.username = '';
    }
    console.log(this.username);
    console.log(this.userInitial);
  }

  // Refresh navbar component when user logs in
  refreshNavbar() {
    this.checkLoginStatus();
    if (this.isLoggedIn) {
      this.loadUserData();
    } else {
      this.userData = null;
    }
  }

  get userInitial(): string {
    return this.formService.getUserInitial();
  }

  // Home navigation method
  goToHome() {
    this.router.navigate(['/Home-Page']);
    this.toggleUserDropdown = false;
  }

  // Dashboard navigation method
  goToDashboard() {
    const userId = this.formService.getCurrentUserId();
    if (userId) {
      this.router.navigate(['/dashboard', userId]);
    } else {
      console.warn('User ID not found for dashboard navigation.');
      this.router.navigate(['/dashboard']);
    }
    this.toggleUserDropdown = false;
  }

  onLogout() {
    this.formService.clearToken();
    this.isLoggedIn = false;
    this.username = '';
    this.userData = null;
    this.toggleUserDropdown = false;
    this.router.navigate(['/']);
    // Trigger navbar refresh after logout
    setTimeout(() => this.refreshNavbar(), 100);
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
      console.log('Confirm deletion of user data.');
      this.loading = true;
      this.formService.deleteFormData(this.userData.id).subscribe({
        next: () => {
          this.userData = null;
          this.loading = false;
          console.log('Your data has been deleted.');
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Failed to delete user data. Please try again later.';
          console.error('Delete failed:', err);
        },
      });
    }
    this.formService.clearToken();
    this.isLoggedIn = false;
    this.username = '';
    this.toggleUserDropdown = false;
    this.router.navigate(['/']);
    setTimeout(() => this.refreshNavbar(), 100);
  }
}
