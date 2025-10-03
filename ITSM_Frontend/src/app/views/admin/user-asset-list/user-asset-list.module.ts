import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { PrimengModule } from 'src/app/primeng/primeng.module';
import { DynamicTableComponent } from "../../../globle_Component/dynamic-table/dynamic-table.component";
import { UserAssetListComponent } from './user-asset-list/user-asset-list.component';
import { UserAssetRoutingModule } from './user-asset-list-routing.module';

@NgModule({
  declarations: [
    UserAssetListComponent
  ],
  imports: [
    CommonModule,
    UserAssetRoutingModule,
    PrimengModule,
    DynamicTableComponent
]
})
export class UserAssetModule { }
