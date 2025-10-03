import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrganizationChartComponent } from './organization-chart/organization-chart.component';

const routes: Routes = [
  {
    path:'',component:OrganizationChartComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrganizationChartRoutingModule { }
