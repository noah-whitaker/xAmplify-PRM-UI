import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomCrmIntegrationComponent } from './custom-crm-integration.component';

describe('CustomCrmIntegrationComponent', () => {
  let component: CustomCrmIntegrationComponent;
  let fixture: ComponentFixture<CustomCrmIntegrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomCrmIntegrationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomCrmIntegrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
