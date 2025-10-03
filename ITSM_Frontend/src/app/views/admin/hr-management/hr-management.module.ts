import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HrManagementRoutingModule } from './hr-management-routing.module';
import { HrManagementComponent } from './hr-management/hr-management.component';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { DynamicTableComponent } from "../../../globle_Component/dynamic-table/dynamic-table.component";
// import { DynamicTableComponent } from '../../../globle_Component/dynamic-table/dynamic-table.component';

@NgModule({
  
  declarations: [
    HrManagementComponent,
    // DynamicTableComponent
    
  ],
  imports: [
    CommonModule,
    HrManagementRoutingModule,
    PrimengModule,
    DynamicTableComponent
]
})
export class HrManagementModule { }
