import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormService } from '../service/form-service.service';
import { IFormStructure } from '../domain/forms';
import { ImportsModule } from '../../src/imports';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface CropSettings {
  scale: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ImportsModule, CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('cropCanvas') cropCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cropImage') cropImage!: ElementRef<HTMLImageElement>;

  userData: any | null = null;
  editableData: any = {};
  originalData: any = {};
  loading = true;
  error: string | null = null;
  formStructure: IFormStructure[] = [];

  // Edit mode properties
  isEditMode = false;
  isSaving = false;

  // Image properties
  profileImage: string | null = null; // This will hold the Base64 image from DB
  selectedImageUrl: string | null = null; // This holds the image selected for cropping
  showCropModal = false;
  cropSettings: CropSettings = {
    scale: 1,
    x: 0,
    y: 0,
  };

  constructor(private formService: FormService, private router: Router) {}

  ngOnInit(): void {
    this.formService
      .getFormStructure()
      .then((data) => {
        this.formStructure = data;
        this.loadUserDataWithRetry();
      })
      .catch((err) => {
        console.error('Error loading form structure:', err);
        this.error = 'Failed to load form structure.';
        this.loading = false;
      });
  }

  loadUserDataWithRetry(maxRetries: number = 3, currentRetry: number = 0): void {
    const userId = this.formService.getCurrentUserId();

    if (userId) {
      this.loadUserData(userId);
    } else if (currentRetry < maxRetries) {
      setTimeout(() => {
        this.loadUserDataWithRetry(maxRetries, currentRetry + 1);
      }, 100 * (currentRetry + 1));
    } else {
      this.error = 'No user ID found. Please log in.';
      this.loading = false;
    }
  }

  loadUserData(userId: number): void {
    this.formService.getFormByUserId(userId).subscribe({
      next: (data) => {
        this.userData = data;
        this.initializeEditableData();
        this.loading = false;
        // Load profile image from userData (fetched from backend)
        this.profileImage = this.userData.profileImageBase64 || null;
      },
      error: (err) => {
        console.error('Error fetching user data:', err);
        this.error = 'Failed to load user data. Please try again later.';
        this.loading = false;
      },
    });
  }

  initializeEditableData(): void {
    if (this.userData) {
      this.editableData = {
        name: this.userData.name || '',
        description: this.userData.description || '',
        birthday: this.userData.birthday
          ? this.formatDateForInput(this.userData.birthday)
          : '',
        gender: this.userData.gender || '',
        age: this.userData.age || 0,
        country: this.userData.country || '',
        skills: this.userData.skills || '',
      };
      // Store original data for cancel functionality
      console.log(this.userData.gender);
      this.originalData = { ...this.editableData };
    }
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.initializeEditableData();
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.editableData = { ...this.originalData };
    this.selectedImageUrl = null;
    this.showCropModal = false;
    // Revert profile image to original if not saved
    this.loadUserData(this.formService.getCurrentUserId()); // Re-fetch or load from original userData
  }

  saveChanges(): void {
    if (!this.userData || this.isSaving) return;

    this.isSaving = true;
    const userId = this.formService.getCurrentUserId();

    // Prepare data for update
    const updateData = {
      ...this.editableData,
      id: userId,
      profileImageBase64: this.profileImage, // Include the profile image
    };

    this.formService.updateFormData(userId, updateData).subscribe({
      next: (response) => {
        console.log('Profile updated successfully:', response);
        this.isEditMode = false;
        this.isSaving = false;

        // Refresh the page content by reloading user data
        this.loadUserData(userId); // This is the key change

        // Show success message (you can implement a toast service)
        this.showSuccessMessage('Profile updated successfully!');
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.isSaving = false;
        this.error = 'Failed to update profile. Please try again.';
        setTimeout(() => (this.error = null), 5000);
      },
    });
  }

  showSuccessMessage(message: string): void {
    // You can implement a proper toast/notification service
    console.log(message);
    // For now, just clear any existing error
    this.error = null;
  }

  getDisplayValue(fieldName: string, value: any): string {
    const fieldConfig = this.formStructure.find(
      (field) => field.name === fieldName
    );

    if (fieldConfig && fieldConfig.options && Array.isArray(fieldConfig.options)) {
      if (fieldName === 'country') {
        let option = fieldConfig.options.find((opt) => opt.value === value);

        if (!option && typeof value === 'number') {
          option = fieldConfig.options[value - 1];
        }

        if (!option && typeof value === 'string' && !isNaN(parseInt(value))) {
          const numValue = parseInt(value);
          option = fieldConfig.options[numValue - 1];
        }

        if (!option && typeof value === 'string') {
          option = fieldConfig.options.find(
            (opt) => opt.label.toLowerCase() === value.toLowerCase()
          );
        }

        return option ? option.label : value || 'Not specified';
      }

      const option = fieldConfig.options.find((opt) => opt.value === value);
      return option ? option.label : value;
    }

    if (fieldName === 'skills' && typeof value === 'string') {
      const skillLabels = value.split(',').map((skillValue) => {
        const matchingOption = fieldConfig?.options?.find(
          (opt) => opt.value === skillValue.trim()
        );
        return matchingOption ? matchingOption.label : skillValue.trim();
      });
      return skillLabels.join(', ');
    }

    return value || 'Not specified';
  }

  getFieldOptions(fieldName: string): any[] {
    const fieldConfig = this.formStructure.find(
      (field) => field.name === fieldName
    );
    return fieldConfig?.options || [];
  }

  isSkillSelected(skillValue: string): boolean {
    if (!this.editableData.skills) return false;
    const skills: string[] =
      typeof this.editableData.skills === 'string'
        ? this.editableData.skills.split(',').map((s: string) => s.trim())
        : (this.editableData.skills as string[]);
    return skills.includes(skillValue);
  }

  toggleSkill(skillValue: string, event: any): void {
    let skills: string[] = [];

    if (this.editableData.skills) {
      skills =
        typeof this.editableData.skills === 'string'
          ? this.editableData.skills
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s)
          : [...this.editableData.skills];
    }

    if (event.target.checked) {
      if (!skills.includes(skillValue)) {
        skills.push(skillValue);
      }
    } else {
      skills = skills.filter((skill) => skill !== skillValue);
    }

    this.editableData.skills = skills.join(',');
  }

  // Image handling methods
  triggerImageUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImageUrl = e.target.result;
        this.showCropModal = true;
      };
      reader.readAsDataURL(file);
    }
  }

  initializeCrop(): void {
    if (!this.cropCanvas || !this.cropImage) return;

    const canvas = this.cropCanvas.nativeElement;
    const img = this.cropImage.nativeElement;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 300;

    this.updateCrop();
  }

  updateCrop(): void {
    if (!this.cropCanvas || !this.cropImage || !this.selectedImageUrl) return;

    const canvas = this.cropCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    const img = this.cropImage.nativeElement;

    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions
    const size = Math.min(canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Apply transformations
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(this.cropSettings.scale, this.cropSettings.scale);
    ctx.translate(this.cropSettings.x, this.cropSettings.y);

    // Draw image
    const imgSize = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = size / imgSize;
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Draw crop circle overlay
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2 - 10, 0, 2 * Math.PI);
    ctx.stroke();
  }

  applyCrop(): void {
    if (!this.cropCanvas) return;

    const canvas = this.cropCanvas.nativeElement;
    this.profileImage = canvas.toDataURL('image/jpeg', 0.8); // Get Base64
    this.closeCropModal();

  }

  closeCropModal(): void {
    this.showCropModal = false;
    this.selectedImageUrl = null;
    this.cropSettings = { scale: 1, x: 0, y: 0 };
  }


  Nouser(): void {
    this.router.navigate(['/login']);
  }

  refreshComponent(): void {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
}