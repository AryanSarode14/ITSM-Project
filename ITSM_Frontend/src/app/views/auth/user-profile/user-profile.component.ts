import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent {
  userCreated: any = localStorage.getItem("userData");
  user:any;
  userid:any;
  name:any;
  constructor(
    private formBuilder: FormBuilder,
    public router: Router,
    public route: ActivatedRoute,
   
  ) {
    
    this.user = JSON.parse(this.userCreated);
    this.userid = this.user.userId;
   this.name=this.user.firstName+" "+this.user.lastName;
    
  }

  ngOnInit(): void {
 

   
  }
}
