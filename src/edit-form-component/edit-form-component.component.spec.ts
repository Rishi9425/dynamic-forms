import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFormComponentComponent } from './edit-form-component.component';

describe('EditFormComponentComponent', () => {
  let component: EditFormComponentComponent;
  let fixture: ComponentFixture<EditFormComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditFormComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditFormComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
