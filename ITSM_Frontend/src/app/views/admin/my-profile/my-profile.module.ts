import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyProfileRoutingModule } from './my-profile-routing.module';
import { RouterModule, Routes } from '@angular/router';
import { MyProfileComponent } from './my-profile.component';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';

const routes: Routes = [
  {
    path:'',component:MyProfileComponent
  }
];

@NgModule({
  declarations: [MyProfileComponent],
  imports: [
    CommonModule,
    MyProfileRoutingModule,
    PrimengModule,
    RouterModule.forChild(routes),
    CardModule,
    FormsModule,
    InputTextModule,
    FileUploadModule,
    ButtonModule
  ],
  exports: [RouterModule]
})
export class MyProfileModule { }
