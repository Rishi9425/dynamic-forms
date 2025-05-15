import { Injectable } from '@angular/core';
import {data} from '../assets/data.json'
@Injectable({
  providedIn: 'root'
})
export class FormServiceService {

  constructor() { }

  private formstype = data;

  getformstructure():  Promise<any[]> {
    return Promise.resolve(this.formstype);
  }
  
}
