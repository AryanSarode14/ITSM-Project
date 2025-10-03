import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserManagementRoutingModule } from './user-management-routing.module';
import { UserManagementComponent } from './user-management/user-management.component';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { DynamicTableComponent } from "../../../globle_Component/dynamic-table/dynamic-table.component";
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    UserManagementComponent
  ],
  imports: [
    CommonModule,
    UserManagementRoutingModule,
    PrimengModule,
    DynamicTableComponent,
    ReactiveFormsModule
]
})
export class UserManagementModule { }
