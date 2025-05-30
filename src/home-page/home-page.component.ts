// home-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { FormService } from '../service/form-service.service';

@Component({
  selector: 'app-home-page',
  standalone: true, 
  imports: [CommonModule], 
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  username: string | null = null;

  constructor(private formService: FormService) {}

  ngOnInit(): void {
    this.username = this.formService.getUsername();
  }
}
