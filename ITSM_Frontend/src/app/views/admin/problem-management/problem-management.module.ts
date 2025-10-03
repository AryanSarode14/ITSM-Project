import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { PrimengModule } from 'src/app/primeng/primeng.module';
import { DynamicTableComponent } from "../../../globle_Component/dynamic-table/dynamic-table.component";
import { ProblemManagementComponent } from './problem-management.component';
import { ProblemManagementRoutingModule } from './problem-management-routing.module';

@NgModule({
  declarations: [
    ProblemManagementComponent
  ],
  imports: [
    CommonModule,
    ProblemManagementRoutingModule,
    PrimengModule,
    DynamicTableComponent
]
})
export class ProblemManagementModule { }
