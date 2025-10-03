import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminDashboardRoutingModule } from './admin-dashboard-routing.module';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  declarations: [
   AdminDashboardComponent  
  ],
  imports: [
    CommonModule,
    AdminDashboardRoutingModule,
    PrimengModule,
    NgxChartsModule

  ]
})
export class AdminDashboardModule { }
