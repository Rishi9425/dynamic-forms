import { TestBed } from '@angular/core/testing';

import { FormService } from './form-service.service';

describe('FormServiceService', () => {
  let service: FormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
