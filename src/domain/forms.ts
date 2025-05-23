export interface IFormStructure {
  type: string;  // text, number, date, textarea, radio, select, checkbox, password, email, etc.
  label: string | Date | number;
  name: string;
  value: string | number | boolean | Date | string[] | number[];
  options?: { label: string; value: number | string | boolean }[];
  validations?: {
    name: string;
    validator: string;  // required, email, minLength, maxLength, pattern, min, max
    message: string;
    value?: any;  // Used for validators that need parameters (minLength, pattern, etc.)
  }[];
}