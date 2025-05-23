import { Injectable } from '@angular/core';
import { IFormStructure } from '../domain/forms';
import { HttpClient } from '@angular/common/http';
import {data} from '../assets/data.json'
@Injectable({
  providedIn: 'root'
})
export class FormService {
private formtype = data
  
  constructor(private http: HttpClient) { }
  
  // Simple method to get form data from JSON file
  getFormStructure(): Promise<IFormStructure[]> {
   return Promise.resolve(this.formtype);
  }
}

 