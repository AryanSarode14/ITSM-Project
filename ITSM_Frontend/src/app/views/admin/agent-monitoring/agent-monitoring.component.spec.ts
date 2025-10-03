import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentMonitoringComponent } from './agent-monitoring.component';

describe('AgentMonitoringComponent', () => {
  let component: AgentMonitoringComponent;
  let fixture: ComponentFixture<AgentMonitoringComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AgentMonitoringComponent]
    });
    fixture = TestBed.createComponent(AgentMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
