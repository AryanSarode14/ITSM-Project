import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgentMonitoringComponent } from './agent-monitoring.component';
import { AgentMonitoringDetailsComponent } from './agent-monitoring-details/agent-monitoring-details.component';

const routes: Routes = [
  {
    path:'',component:AgentMonitoringComponent
  }, {
     path:'agent-details/:id', component: AgentMonitoringDetailsComponent ,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgentMonitoringRoutingModule { }
