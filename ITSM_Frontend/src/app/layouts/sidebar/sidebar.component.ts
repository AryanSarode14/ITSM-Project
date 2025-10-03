import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() collapsed = false;

  @Output() toggle = new EventEmitter<void>();
  isVisible:boolean=false;
  showUserAssets:boolean=false;
  parsedUserData:any;
  isMobile: boolean=false;
  CompanyCredit:boolean=true;
  currentRole:any;
  constructor() {
    
    this.checkIfMobile();
    const userData = localStorage.getItem('userData'); 
    this.parsedUserData = userData ? JSON.parse(userData) : null;
    const storedUserData = localStorage.getItem('userData');

// Parse the stored string into an object
if (storedUserData) {
  const userData = JSON.parse(storedUserData);
  
  // Access the 'role' property
  this.currentRole= userData.role;
  
 // Output: Administrator
}

  }

  // Add a listener to handle window resizing
  @HostListener('window:resize', ['$event'])
  onResize(event:any) {
    // this.checkIfMobile();
  }

  // Function to check if the screen width is mobile size
  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
    if(this.isMobile){
      this.onToggle() 
    }
  }


  onToggle() {
    // console.log('toggled');
    
    this.collapsed = !this.collapsed;
    if(!this.collapsed) {
      setTimeout(() => {
        this.CompanyCredit = true;
      }, 260);
    }else {
      this.CompanyCredit = false;
    }
    var title = document.getElementById('title');
    // (this.collapsed) ? title!.style.display = 'none' : title!.style.display = 'block';
    this.toggle.emit();
  }

  getToggleIcon() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      return !this.collapsed ? 'pi-bars mobile-bars' : 'pi-times';  // Bars when collapsed, Times when opened
    }
    return !this.collapsed ? 'pi-times' : 'pi-bars'; // Default for non-mobile view
  }

  
}
