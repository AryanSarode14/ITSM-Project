import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrganizationChartRoutingModule } from './organization-chart-routing.module';
import { OrganizationChartComponent } from './organization-chart/organization-chart.component';
import { PrimengModule } from 'src/app/primeng/primeng.module';


@NgModule({
  declarations: [
    OrganizationChartComponent
  ],
  imports: [
    CommonModule,
    OrganizationChartRoutingModule,
    PrimengModule
  ]
})
export class OrganizationChartModule { }
