import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserAssetListComponent } from './user-asset-list/user-asset-list.component';
// import { AssetManagementComponent } from './asset-management/asset-management.component';

const routes: Routes = [
  {
    path:'',component:UserAssetListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserAssetRoutingModule { }
