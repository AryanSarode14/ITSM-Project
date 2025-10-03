import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentMonitoringDetailsComponent } from './agent-monitoring-details.component';

describe('AgentMonitoringDetailsComponent', () => {
  let component: AgentMonitoringDetailsComponent;
  let fixture: ComponentFixture<AgentMonitoringDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AgentMonitoringDetailsComponent]
    });
    fixture = TestBed.createComponent(AgentMonitoringDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
