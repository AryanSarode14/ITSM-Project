import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChangeManagementRoutingModule } from './change-management-routing.module';
import { ChangeManagementComponent } from './change-management/change-management.component';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { DynamicTableComponent } from "../../../globle_Component/dynamic-table/dynamic-table.component";
import { ApprovalRequestComponent } from './approval-request/approval-request.component';


@NgModule({
  declarations: [
    ChangeManagementComponent,
    ApprovalRequestComponent
  ],
  imports: [
    CommonModule,
    ChangeManagementRoutingModule,
    PrimengModule,
    DynamicTableComponent
]
})
export class ChangeManagementModule { }
