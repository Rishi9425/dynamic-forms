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
  profileImage: string | null = null;
  private routerSubscription: Subscription = new Subscription();
  private authSubscription: Subscription = new Subscription();
  private profileUpdateSubscription: Subscription = new Subscription();

  constructor(private formService: FormService, private router: Router) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.loadUserData();
    this.setupAuthSubscription();
    this.setupRouterSubscription();
    this.setupProfileUpdateSubscription();
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.profileUpdateSubscription) {
      this.profileUpdateSubscription.unsubscribe();
    }
  }

  setupAuthSubscription() {
    this.authSubscription = this.formService.authStatusChanged?.subscribe(
      () => {
        console.log('Auth status changed, refreshing navbar...');
        this.refreshNavbar();
      }
    );
  }

  setupProfileUpdateSubscription() {
    this.profileUpdateSubscription = this.formService.profileUpdated?.subscribe(
      () => {
        console.log('Profile updated, refreshing navbar...');
        this.loadUserData();
      }
    );
  }

  setupRouterSubscription() {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const currentLoginStatus = this.formService.isAuthenticated();
        if (currentLoginStatus !== this.isLoggedIn) {
          console.log('Login status changed after navigation, refreshing...');
          this.refreshNavbar();
        }
        this.loadUserData();
      });
  }

  loadUserData(): void {
    setTimeout(() => {
      const Id = this.formService.getCurrentUserId();
      console.log('Loading user data for ID:', Id);
      
      if (Id && Id !== 0) {
        this.formService.getFormByUserId(Id).subscribe({
          next: (data) => {
            this.userData = data;
            this.profileImage = this.userData.profileImageBase64 || null;
            this.loading = false;
            console.log('User data loaded successfully, profile image:', this.profileImage ? 'exists' : 'null');
          },
          error: (err) => {
            console.error('Error fetching user data:', err);
            this.error = 'Failed to load user data. Please try again later.';
            this.loading = false;
            this.profileImage = null;
          },
        });
      } else {
        this.userData = null;
        this.profileImage = null;
        this.loading = false;
  
        if (this.isLoggedIn) {
          console.warn('User is logged in but no valid ID found. Current stored ID:', localStorage.getItem('current_user_id'));
          console.warn('Debug info:', {
            isAuthenticated: this.formService.isAuthenticated(),
            hasToken: !!this.formService.getToken(),
            currentUserId: this.formService.getCurrentUserId(),
            storedToken: localStorage.getItem('jwt_token'),
            storedUserId: localStorage.getItem('current_user_id')
          });
    
          this.checkLoginStatus();
        }
      }
    }, 250); 
  }

  checkLoginStatus() {
    this.isLoggedIn = this.formService.isAuthenticated();
    console.log('Login status check:', {
      isLoggedIn: this.isLoggedIn,
      token: !!this.formService.getToken(),
      userId: this.formService.getCurrentUserId(),
      storedUserId: localStorage.getItem('current_user_id')
    });
    
    if (this.isLoggedIn) {
      this.username = this.formService.getUsername() || 'User';
    } else {
      this.username = '';
      this.profileImage = null;
    }
  }

  refreshNavbar() {
    console.log('Refreshing navbar...');
    this.checkLoginStatus();
    if (this.isLoggedIn) {
      this.loadUserData();
    } else {
      this.userData = null;
      this.profileImage = null;
    }
  }

  get userInitial(): string {
    return this.formService.getUserInitial();
  }

  goToHome() {
    this.router.navigate(['/Home-Page']);
    this.toggleUserDropdown = false;
  }

  goToDashboard() {
    // Wait a moment for localStorage to be updated if just logged in
    setTimeout(() => {
      const userId = this.formService.getCurrentUserId();
      console.log('Dashboard navigation - User ID:', userId);
      
      if (userId && userId !== 0) {
        this.router.navigate(['/dashboard', userId]);
      } else {
        console.warn('User ID not found for dashboard navigation. Attempting to reload user data...');
        this.loadUserData();
        
        setTimeout(() => {
          const retryUserId = this.formService.getCurrentUserId();
          if (retryUserId && retryUserId !== 0) {
            this.router.navigate(['/dashboard', retryUserId]);
          } else {
            console.error('Unable to get user ID even after retry');
            console.error('Debug info:', {
              isAuthenticated: this.formService.isAuthenticated(),
              hasToken: !!this.formService.getToken(),
              storedToken: localStorage.getItem('jwt_token'),
              storedUserId: localStorage.getItem('current_user_id')
            });
          
            this.router.navigate(['/login']);
          }
        }, 300);
      }
    }, 150);
    this.toggleUserDropdown = false;
  }

  onLogout() {
    console.log('Logging out user...');
    this.formService.clearToken();
    this.isLoggedIn = false;
    this.username = '';
    this.userData = null;
    this.profileImage = null;
    this.toggleUserDropdown = false;
    this.router.navigate(['/']);
    setTimeout(() => this.refreshNavbar(), 100);
  }

  onEditPassword() {
    const userId = this.formService.getCurrentUserId();
    if (userId && userId !== 0) {
      this.router.navigate(['/Update-password', userId]);
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
          this.profileImage = null;
          this.loading = false;
          console.log('Your data has been deleted.');
          this.formService.clearToken();
          this.isLoggedIn = false;
          this.username = '';
          this.toggleUserDropdown = false;
          this.router.navigate(['/']);
          setTimeout(() => this.refreshNavbar(), 100);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Failed to delete user data. Please try again later.';
          console.error('Delete failed:', err);
        },
      });
    }
  }
}