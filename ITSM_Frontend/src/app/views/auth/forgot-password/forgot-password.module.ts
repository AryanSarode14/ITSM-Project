import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ForgotPasswordRoutingModule } from './forgot-password-routing.module';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { VerifyOTPComponent } from './verify-otp/verify-otp.component';


@NgModule({
  declarations: [
    ForgotPasswordComponent,
    VerifyOTPComponent
  ],
  imports: [
    CommonModule,
    ForgotPasswordRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    PrimengModule
  ]
})
export class ForgotPasswordModule { }
