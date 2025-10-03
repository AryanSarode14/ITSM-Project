import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { VerifyOTPComponent } from './verify-otp/verify-otp.component';
import { forgotPassGuard } from 'src/app/helpers/forgot-pass.guard';

const routes: Routes = [
  {path:'',component:ForgotPasswordComponent},
  {path:'verifyOTP',component:VerifyOTPComponent,canActivate:[forgotPassGuard]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ForgotPasswordRoutingModule { }
