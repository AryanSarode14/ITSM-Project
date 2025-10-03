import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChangeManagementComponent } from './change-management/change-management.component';
import { ApprovalRequestComponent } from './approval-request/approval-request.component';

const routes: Routes = [

  {path:'',component:ChangeManagementComponent},
  {path:'Request',component:ApprovalRequestComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChangeManagementRoutingModule { }
