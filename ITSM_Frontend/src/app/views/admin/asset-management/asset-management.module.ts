import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssetManagementRoutingModule } from './asset-management-routing.module';
import { AssetManagementComponent } from './asset-management/asset-management.component';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { DynamicTableComponent } from "../../../globle_Component/dynamic-table/dynamic-table.component";

@NgModule({
  declarations: [
    AssetManagementComponent
  ],
  imports: [
    CommonModule,
    AssetManagementRoutingModule,
    PrimengModule,
    DynamicTableComponent
]
})
export class AssetManagementModule { }
