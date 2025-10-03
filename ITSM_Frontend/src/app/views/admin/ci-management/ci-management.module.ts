import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CiManagementRoutingModule } from './ci-management-routing.module';
import { CiManagementComponent } from './ci-management/ci-management.component';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { DynamicTableComponent } from "../../../globle_Component/dynamic-table/dynamic-table.component";


@NgModule({
  declarations: [
    CiManagementComponent
  ],
  imports: [
    CommonModule,
    CiManagementRoutingModule,
    PrimengModule,
    DynamicTableComponent
]
})
export class CiManagementModule { }
