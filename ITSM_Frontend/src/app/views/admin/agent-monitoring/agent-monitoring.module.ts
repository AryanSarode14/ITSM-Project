import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { DynamicTableComponent } from "../../../globle_Component/dynamic-table/dynamic-table.component";
import { ReactiveFormsModule } from '@angular/forms';
import { AgentMonitoringComponent } from './agent-monitoring.component';
import { AgentMonitoringRoutingModule } from './agent-monitoring-routing.module';
import { AgentMonitoringDetailsComponent } from './agent-monitoring-details/agent-monitoring-details.component';


@NgModule({
  declarations: [
    AgentMonitoringComponent,
    AgentMonitoringDetailsComponent
  ],
  imports: [
    CommonModule,
    AgentMonitoringRoutingModule,
    PrimengModule,
    DynamicTableComponent,
    ReactiveFormsModule
]
})
export class AgentMonitoringModule { }
