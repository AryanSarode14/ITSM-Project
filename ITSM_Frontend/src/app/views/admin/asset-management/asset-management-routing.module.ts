import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssetManagementComponent } from './asset-management/asset-management.component';
// import { AssetManagementComponent } from './asset-management/asset-management.component';
const routes: Routes = [
  {
    path:'',component:AssetManagementComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssetManagementRoutingModule { }
