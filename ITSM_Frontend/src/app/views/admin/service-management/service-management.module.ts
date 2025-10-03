import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ServiceManagementRoutingModule } from './service-management-routing.module';
import { ServiceManagementComponent } from './service-management/service-management.component';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { DynamicTableComponent } from "../../../globle_Component/dynamic-table/dynamic-table.component";


@NgModule({
  declarations: [
    ServiceManagementComponent
  ],
  imports: [
    CommonModule,
    ServiceManagementRoutingModule,
    PrimengModule,
    DynamicTableComponent
]
})
export class ServiceManagementModule { }
