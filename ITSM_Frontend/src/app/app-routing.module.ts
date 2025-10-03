import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './layouts/auth/auth.component';
import { AdminComponent } from './layouts/admin/admin.component';
import { authGuard } from './helpers/auth.guard';
import { PageNotFoundComponent } from './layouts/page-not-found/page-not-found.component';


const routes: Routes = [
{
  path:'',redirectTo:'/auth/login',pathMatch:'full'
},
{
  path:'auth',
  component:AuthComponent,

  children:[
    {
      path:'login',
      loadChildren:()=>import('./views/auth/login/login.module').then(mod=>mod.LoginModule),
    },
    {
      path:'register',
      loadChildren:()=>import('./views/auth/register/register.module').then(mod=>mod.RegisterModule)
    },
    {
      path:'forgot-password',
      loadChildren:()=>import('./views/auth/forgot-password/forgot-password.module').then(mod=>mod.ForgotPasswordModule)
    }
  ]
},
{
  path:'admin',
  component:AdminComponent,
  canActivate: [authGuard], 
  children:[
    {
      path:'admin-dashboard',
      loadChildren:()=>import('./views/admin/admin-dashboard/admin-dashboard.module').then(mod=>mod.AdminDashboardModule)
    },
    {
      path:'user-management',
      loadChildren:()=>import('./views/admin/user-management/user-management.module').then(mod=>mod.UserManagementModule)
    },
    {
      path:'hr-management',
      loadChildren:()=>import('./views/admin/hr-management/hr-management.module').then(mod=>mod.HrManagementModule)
    },
    {
      path:'CI-management',
      loadChildren:()=>import('./views/admin/ci-management/ci-management.module').then(mod=>mod.CiManagementModule)
    },
    {
      path:'incident',
      loadChildren:()=>import('./views/admin/incident-management/incident-management.module').then(mod=>mod.IncidentManagementModule)
    }
    ,
    {
      path:'service-management',
      loadChildren:()=>import('./views/admin/service-management/service-management.module').then(mod=>mod.ServiceManagementModule)
    }
    ,
    {
      path:'chart',
      loadChildren:()=>import('./views/admin/organization-chart/organization-chart.module').then(mod=>mod.OrganizationChartModule)
    }
    ,
    {
      path:'asset-management',
      loadChildren:()=>import('./views/admin/asset-management/asset-management.module').then(mod=>mod.AssetManagementModule)
    },
    {
      path:'end-point-devices',
      loadChildren:()=>import('./views/admin/agent-monitoring/agent-monitoring.module').then(mod=>mod.AgentMonitoringModule)
    },
    {
      path:'my-profile',
      loadChildren:()=>import('./views/admin/my-profile/my-profile.module').then(mod=>mod.MyProfileModule)
    },
    {
      path:'problem-management',
      loadChildren:()=>import('./views/admin/problem-management/problem-management.module').then(mod=>mod.ProblemManagementModule)
    },
    {
      path:'change-management',
      loadChildren:()=>import('./views/admin/change-management/change-management.module').then(mod=>mod.ChangeManagementModule)
    },
    {
      path:'user-assets',
      loadChildren:()=>import('./views/admin/user-asset-list/user-asset-list.module').then(mod=>mod.UserAssetModule)
    },
  ]
},
{
  path:'**',component:PageNotFoundComponent
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
