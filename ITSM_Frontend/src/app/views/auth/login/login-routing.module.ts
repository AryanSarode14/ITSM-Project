import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { loginAuthGuard } from 'src/app/helpers/login-auth-guard.guard';


const routes: Routes = [
 
  {
    path:'',component:LoginComponent,
    canActivate: [loginAuthGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoginRoutingModule { }
