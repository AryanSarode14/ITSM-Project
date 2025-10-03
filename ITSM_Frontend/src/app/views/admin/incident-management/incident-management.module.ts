import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IncidentManagementRoutingModule } from './incident-management-routing.module';
import { IncidentComponent } from './incident/incident.component';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { DynamicTableComponent } from "../../../globle_Component/dynamic-table/dynamic-table.component";
import { IncidentTableComponent } from 'src/app/globle_Component/incident-table/incident-table.component';


@NgModule({
  declarations: [
    IncidentComponent
  ],
  imports: [
    CommonModule,
    IncidentManagementRoutingModule,
    PrimengModule,
    DynamicTableComponent,
    IncidentTableComponent
]
})
export class IncidentManagementModule { }
