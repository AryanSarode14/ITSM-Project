import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/auth.service';
import { ToasterService } from 'src/app/Services/toaster.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  forgotPasswordForm!: FormGroup;
  isLoading = false; 
  constructor(private fb: FormBuilder,private router:Router,private authService:AuthService,private toasterService:ToasterService) { }

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
  
    if (this.forgotPasswordForm.valid) {
      this.isLoading=true
      this.authService.sentOtp(this.forgotPasswordForm.value).subscribe({
        next:(res:any)=>{
          // console.log(res);
          localStorage.setItem('otpEmail',this.forgotPasswordForm.value.email );
          this.router.navigateByUrl('/auth/forgot-password/verifyOTP')
           this.toasterService.showSuccess("OTP Sent Successfully ! Please Check Your Email")
           this.isLoading=false
        },
        error:(err:any)=>{
        this.toasterService.showWarn(err.error.error)
        this.isLoading=false
        }
       })

    }
  }

 
}