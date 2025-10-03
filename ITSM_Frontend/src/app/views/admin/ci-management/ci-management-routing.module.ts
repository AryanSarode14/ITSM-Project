import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CiManagementComponent } from './ci-management/ci-management.component';

const routes: Routes = [
  {path:'',component:CiManagementComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CiManagementRoutingModule { }
