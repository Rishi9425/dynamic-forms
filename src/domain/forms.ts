export interface IFormStructure {
  type: string;  
  label: string | Date | number;
  name: string;
  value: string | number | boolean | Date | string[] | number[];
  options?: { label: string; value: number | string | boolean }[];
  validations?: {
    name: string;
    validator: string;  
    message: string;
    value?: any; 
  }[];
}