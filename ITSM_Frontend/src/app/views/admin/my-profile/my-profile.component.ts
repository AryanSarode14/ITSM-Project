import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Table } from 'primeng/table';
import { CommonservicesService } from 'src/app/Services/commonservices.service';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';

interface User {
  firstName: string;
  middleName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  description: string;
  profile: File | string; // Adjust if you have a profile image
  profileid: number;
}

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
})
export class MyProfileComponent {
  editUserId!: any;
  userDialouge: boolean = false;
  customers: any[] = [];
  representatives: any[] = [];
  selectedRepresentative: any;
  userForm!: FormGroup;
  supportGroups = [];
  userRoles = [];
  levels = [];
  usernames = [];
  genders = [];
  reportingTo = [];
  updateButton: boolean = false;
  reportingtoshow: boolean = false;
  // blockedPanel:boolean=false
  customer: any = [];
  groupedTickets: any;
  columns = [
    { field: 'firstName', header: 'First Name' },
    { field: 'lastName', header: 'Last Name' },
    { field: 'userName', header: 'User Name' },
    { field: 'email', header: 'Email ID' },
    { field: 'mobileNumber', header: 'Mobile No.' },
    { field: 'level', header: 'Level' },
    { field: 'has_access', header: 'Access' },
  ];
  loading: boolean = true;
  @ViewChild('dt2') dt2!: Table;
  currentUserId: any;
  userId: any;
  user: User = {
    firstName: '',
    middleName: '',
    lastName: '',
    mobileNumber: '',
    email: '',
    description: '',
    profile: 'assets/images/profile images1.png',
    profileid: 0,
  };
  role: any;

  constructor(
    private fb: FormBuilder,
    private managementService: ManagementService,
    private toaster: ToasterService,
    private commonservice:CommonservicesService
  ) {
    this.getAllUserList();
  }

  loadData() {
    // Simulate a data load
    setTimeout(() => {
      this.loading = false;
      // Your data loading logic here
    }, 2000); // Adjust time as needed
  }
  ngOnInit() {
    // Retrieve userData from localStorage
    const storedUserData = localStorage.getItem('userData');

    // Check if userData exists
    if (storedUserData) {
      // Parse the JSON string back into an object
      const userData = JSON.parse(storedUserData);

      // Now you can access the properties of userData
      this.userId = userData.user_id;
      this.role = userData.role;
      // console.log('User ID1:', this.userId); // Should log 1062
    } else {
      console.log('No user data found in localStorage');
    }
    if(this.role == 'Administrator'){
       this.reportingtoshow = false;
    }

    this.loadData();
    this.getSupportGroupList();
    this.getUserRole();
    this.getUserLevel();
    this.getGenderList();
    this.getRepotingTo();
    this.getuserbyid();

    this.representatives = [
      { name: 'Amy Elsner', severity: 'info', image: 'pi pi-user' },
      { name: 'Anna Fali', severity: 'success', image: 'pi pi-user' },
    ];

    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      description: [''],
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      supportGroup: [''],
      userRole: [''],
      level: [''],
      userName: ['', Validators.required],
      genderId: [''],
      reportingTo: [''],
    });
  }
  getuserbyid() {
    this.managementService.getUserById('api/getuser', this.userId).subscribe({
      next: (res: any) => {
        // console.log('User data', res);
        this.user = {
          firstName: res.first_name,
          middleName: res.middle_name,
          lastName: res.last_name,
          email: res.email_id,
          mobileNumber: res.mobile_no,
          description: res.description,
          profileid: res.attachments.length > 0 ? res.attachments[0].id : null,
          profile:
            res.attachments.length > 0
              ? res.attachments[0].filePath.replace(/'/g, '')
              : 'assets/images/user.png', // Clean up the URL and set default
        };
        this.patchUserData(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  patchUserData(user: any): void {
    this.userForm.patchValue({
      firstName: user.first_name,
      middleName: user.middle_name || '', // Handle potential null
      lastName: user.last_name,
      description: user.description,
      email: user.email_id,
      mobileNumber: user.mobile_no,
      userName: user.user_name,
      password: '', // Don't patch password for security reasons
      supportGroup: user.support_group_id || null, // Handle potential null
      userRole: user.role_id || null, // Handle potential null
      level: user.level_id || null, // Handle potential null
      genderId: user.gender_id || null, // Handle potential null
      reportingTo: user.reporting_to_id || null, // Handle potential null
    });
  }

  getAllUserList() {
    // console.log('get all user list');

    this.managementService.getDropdownListData('api/getusers').subscribe({
      next: (res: any) => {
        this.customers = res;
        // this.toaster.showSuccess('Record Loaded Successfully');
        // console.log('res', res);
      },
      error: (err: any) => {},
    });
  }

  getSupportGroupList() {
    // console.log('done');

    this.managementService
      .getDropdownListData('api/support_group_details')
      .subscribe({
        next: (res: any) => {
          this.supportGroups = res;
          // console.log(res);
        },
        error: (err: any) => {},
      });
  }

  getUserRole() {
    // console.log(' getUserRole done');

    this.managementService.getDropdownListData('api/user_roles').subscribe({
      next: (res: any) => {
        this.userRoles = res;
        // console.log(res);
      },
      error: (err: any) => {},
    });
  }
  getUserLevel() {
    // console.log(' getUserLevel done');

    this.managementService.getDropdownListData('api/level_details').subscribe({
      next: (res: any) => {
        this.levels = res;
        // console.log(res);
      },
      error: (err: any) => {},
    });
  }
  getGenderList() {
    // console.log(' getGenderList done');

    this.managementService.getDropdownListData('api/getallgender').subscribe({
      next: (res: any) => {
        this.genders = res;
        // console.log(res);
      },
      error: (err: any) => {},
    });
  }
  getRepotingTo() {
    // console.log('getReportingTo done');

    this.managementService.getDropdownListData('api/getreporting').subscribe({
      next: (res: any) => {
        // Convert user_id to number
        this.reportingTo = res.map(
          (item: { user_id: any; full_name: any }) => ({
            user_id: Number(item.user_id), // Convert to number
            full_name: item.full_name,
          })
        );
        // console.log(this.reportingTo);  // Check the converted list
      },
      error: (err: any) => {
        console.error('Error fetching reporting list:', err); // Handle error
      },
    });
  }

  // Function to handle filtering from input
  onInputChange(event: any) {
    const inputValue = event.target.value;
    if (inputValue !== null && inputValue !== undefined) {
      this.dt2.filterGlobal(inputValue, 'contains'); // Apply global filtering to the table
    }
  }

  openDialogue(userId: number): void {
    this.editUserId = userId;
    this.userDialouge = true;

    // Fetch user data from API
    this.getuserbyid();
  }

  capitalizeWords(): string {
    const names = [this.user.firstName];

    // Check if middleName exists and is not null
    if (this.user.middleName) {
      names.push(this.user.middleName);
    }

    names.push(this.user.lastName);

    return names
      .map((name) => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
      .join(' ');
  }

  onUpdate() {
    this.managementService
      .editData('api/updateuser', this.editUserId, this.userForm.value)
      .subscribe({
        next: (res: any) => {
          this.getuserbyid();
          this.userDialouge = false;
          this.toaster.showSuccess('Record Update Successfully !...');
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
          this.userDialouge = false;
        },
      });
  }

  handleUpload(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      // Create a FormData object to hold the file and other data
      const formData = new FormData();
  
      // Add user profile picture file to FormData
      formData.append('profile', fileInput.files[0]);
  
      // Create a payload that includes the attachment ID (null if no valid profile ID exists)
      const attachmentId = this.user.profileid !== null ? this.user.profileid : null;
      const payload = {
        id: attachmentId,  // This will be null if no valid profile ID exists
        user_id: this.userId,
      };
  
      // Append additional data to the FormData object
      for (const key in payload) {
        if (payload.hasOwnProperty(key)) {
          formData.append(key, payload[key as keyof typeof payload] === null ? 'null' : payload[key as keyof typeof payload]);
        }
      }
  
      // Call the API to upload the profile picture
      this.managementService
        .myprofileUpload('api/uploadProfilePicture', formData)
        .subscribe(
          (response) => {
            this.toaster.showSuccess('Profile picture uploaded successfully');
  
            // Update user profile with new image URL if available
            if (response && response.data && response.data.file_path) {
              this.user.profile = response.data.file_path.replace(/'/g, ''); // Clean up URL if necessary
            } else {
              this.user.profile = 'assets/images/profile images1.png'; // Fallback if no URL is provided
            }
            this.commonservice.setUser(this.user);
          },
          (error) => {
            this.toaster.showError('Error uploading profile picture');
          }
        );
    }
  }
  

  getProfileImageUrl(): any {
    return this.user.profile || 'assets/images/profile images1.png'; // Default image if no profile
  }
}
