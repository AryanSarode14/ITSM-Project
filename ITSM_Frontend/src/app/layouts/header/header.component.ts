import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ManagementService } from 'src/app/Services/management.service';
import { CommonservicesService } from 'src/app/Services/commonservices.service';

interface User {
  profile: File | string; // Adjust if you have a profile image
  profileid: number;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() toggle = new EventEmitter<void>();
  @ViewChild('SidebarComponent') sideBarComponent!: SidebarComponent; 
  isCollapsed = false;
  currentDateTime!: string;
  items: MenuItem[] | undefined;
  isMobile!: boolean;
  user: any = {
    profile: 'assets/images/user.png',
    profileid: 0,
  };
  userId: any;
 
    constructor(private router:Router,private managementService:ManagementService,
      private commonservice:CommonservicesService
    ){}
  ngOnInit() {
    // Retrieve userData from localStorage
    const storedUserData = localStorage.getItem('userData');

    // Check if userData exists
    if (storedUserData) {
      // Parse the JSON string back into an object
      const userData = JSON.parse(storedUserData);

      // Now you can access the properties of userData
      this.userId = userData.user_id;
      // console.log('User ID:', this.userId); // Should log 1062
    } else {
      console.log('No user data found in localStorage');
    }
    this.items = [
        {
            separator: true
        },
        {
            label: 'My Profile',
            icon: 'pi pi-user', // Changed icon to 'user'
            command: () => this.myprofile()
        },
        {
            label: 'Reset Password',
            icon: 'pi pi-key', // Changed icon to 'key'
            command: () => this.resetPassword() 
        },
        {
            label: 'Logout',
            icon: 'pi pi-sign-out', // Changed icon to 'sign-out'
            command: () => this.logout() 
        }
    ];
    this.getuserbyid();
    this.commonservice.user$.subscribe(user => {
      this.user = user; // Update user data whenever it changes
    });

    this.updateTime(); // Call it once to set the initial time
  setInterval(() => this.updateTime(), 1000);
    
  }

  getuserbyid() {
    this.managementService.getUserById('api/getuser', this.userId).subscribe({
      next: (res: any) => {
        // console.log('User data', res);
        this.user = {
          profileid: res.attachments.length > 0 ? res.attachments[0].id : null,
          profile:
            res.attachments.length > 0
              ? res.attachments[0].filePath.replace(/'/g, '')
              : 'assets/images/user.png', // Clean up the URL and set default
        };
      },
    });
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
  toggleSidebar() {
    this.toggle.emit(); // Emit event to parent component
    this.isCollapsed=!this.isCollapsed
  }
  toggleMobileSidebar() {
    if (this.sideBarComponent) {
      this.sideBarComponent.onToggle();
    }
  }
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('otpEmail');
    localStorage.removeItem('userData');
    this.router.navigateByUrl('auth/login')
  }
  resetPassword() {
    this.router.navigateByUrl('auth/forgot-password')
  }
  myprofile(){
    this.router.navigateByUrl('admin/my-profile')
  }
  updateTime() {
    const now = new Date();
    this.currentDateTime = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
}
