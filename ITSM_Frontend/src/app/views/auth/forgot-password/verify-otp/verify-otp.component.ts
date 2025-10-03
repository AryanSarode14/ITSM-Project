import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/auth.service';
import { ToasterService } from 'src/app/Services/toaster.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss']
})
export class VerifyOTPComponent {
  forgotPasswordForm!: FormGroup;
  isLoading: boolean = false; 
  otpEmail: any;
  mismatch:boolean=false
  constructor(private fb: FormBuilder,private authService:AuthService,private toasterService:ToasterService,private router:Router) {
    this.otpEmail = localStorage.getItem('otpEmail');
  }

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    });

    const email = this.otpEmail;
    this.forgotPasswordForm.patchValue({ email });
  }

  checkPasswordsMatch(): void {
    const newPassword = this.forgotPasswordForm.get('newPassword')?.value;
    const confirmPassword = this.forgotPasswordForm.get('confirmPassword')?.value;

    if (  newPassword === confirmPassword) {
      this.mismatch=false
    } else {
      this.mismatch=true
    }
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      var formData={
        email: this.forgotPasswordForm.value.email,
        otp: this.forgotPasswordForm.value.otp,
        newPassword: this.forgotPasswordForm.value.newPassword
    }
      this.isLoading = true; 
     
      this.authService.verifyOTP(formData).subscribe({
        next:(res:any)=>{
         
          this.router.navigateByUrl('/auth/login')
           this.toasterService.showSuccess(" Verify OTP Successfully & Change Password Successfully")
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
