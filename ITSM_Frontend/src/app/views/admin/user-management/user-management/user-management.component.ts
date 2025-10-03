import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Table } from 'primeng/table'; // Import PrimeNG Table
import { DynamicTableComponent } from 'src/app/globle_Component/dynamic-table/dynamic-table.component';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  @ViewChild('dt2') dt2!: Table; // Access the PrimeNG table
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
  // blockedPanel:boolean=false
  customer: any = [];
  groupedTickets: any;
  addSupportDialog:boolean=false
  addSupportGroupForm!:FormGroup
  addRoletDialog:boolean=false;
  addLeveleDialog:boolean=false;
  addRoleFormData!:FormGroup;
  addLevelFormData!:FormGroup;

  showBulkUploadModal: boolean = false;
  selectedFile: File | null = null; // Variable to store the selected file
  selectedFileName: string | null = null;
  showHelpDialog: boolean = false;
  columns = [
    { field: 'firstName', header: 'First Name' },
    { field: 'lastName', header: 'Last Name' },
    { field: 'userName', header: 'User Name' },
    { field: 'email', header: 'Email ID' },
    { field: 'mobileNumber', header: 'Mobile No.' },
    { field: 'level_name', header: 'Level' },
    { field: 'has_access', header: 'Access' },
  ];
  loading: boolean = true;

  constructor(
    private fb: FormBuilder,
    private managementService: ManagementService,
    private toaster: ToasterService,
    private http: HttpClient
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
    this.loadData();
    this.getSupportGroupList();
    this.getUserRole();
    this.getUserLevel();
    this.getGenderList();
    this.getRepotingTo();

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
      userRole: ['',Validators.required],
      level: [''],
      userName: ['', Validators.required],
      genderId: ['',Validators.required],
      reportingTo: [''],
    });

    this.addSupportGroupForm=this.fb.group({
      support_group_name:['',Validators.required]
    })
    this.addRoleFormData=this.fb.group({
      role_name:['',Validators.required]
    })
    this.addLevelFormData=this.fb.group({
      level_name:['',Validators.required]
    })
  }

   // Method to show help dialog
   showHelpDialogModal() {
    this.showHelpDialog = true;
  }

  // Method to hide help dialog
  onCloseHelpDialog() {
    this.showHelpDialog = false;
  }

  downloadTemplate() {
    // Path to the Excel template in your assets folder
    const templatePath = 'assets/templates/user.xlsx';

    // Get the Excel file and trigger download
    this.http.get(templatePath, { responseType: 'blob' }).subscribe(
      (blob) => {
        // Create a link element and download the file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user.xlsx'; // File name when downloading
        a.click();
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        console.error('Error downloading the template', error);
      }
    );
  }

  onFileSelect(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      this.selectedFileName = this.selectedFile.name; // Set the selected file name
    } else {
      this.selectedFileName = null; // Clear the name if no file is selected
    }
  }

  uploadSelectedFile() {
    if (this.selectedFile) {
      // Prepare FormData with the selected file
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      // Call the upload API with the file
      this.managementService.userbulkUpload('api/userbulkupload', formData).subscribe(
        (response) => {
          // console.log('Upload successful', response);
          this.toaster.showSuccess('File uploaded successfully!');

          this.selectedFile = null;
          this.selectedFileName = null;
          this.onCloseBulkUploadModal();
          this.getAllUserList();
        },
        (error) => {
          console.error('Error uploading file', error);
          this.toaster.showError('File upload failed. Please try again.');
        }
      );
    }
  }

  // Method to close the bulk upload modal
  onCloseBulkUploadModal() {
    this.showBulkUploadModal = false;
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
            this.reportingTo = res.map((item: { user_id: any; full_name: any; }) => ({
                user_id: Number(item.user_id),  // Convert to number
                full_name: item.full_name
            }));
            // console.log(this.reportingTo);  // Check the converted list
        },
        error: (err: any) => {
            console.error('Error fetching reporting list:', err);  // Handle error
        },
    });
}


  openEditDialogue(rowData: any) {
   
    this.editUserId = rowData?.user_id;
    // console.log(rowData);

    this.userForm.patchValue({
      firstName: rowData?.firstName,
      middleName: rowData?.middleName,
      lastName: rowData?.lastName,
      description: rowData?.description,
      email: rowData?.email,
      mobileNumber: rowData?.mobileNumber,
      password: rowData?.password,
      supportGroup: rowData?.support_group_id,
      userRole: rowData?.role_id,
      level: rowData?.level_id,
      userName: rowData?.userName,
      genderId: rowData?.gender_id,
      reportingTo: rowData?.reportingTo,
    });
    this.userDialouge = true;
  }

  // Function to handle filtering from input
  onInputChange(event: any) {
    const inputValue = event.target.value;
    if (inputValue !== null && inputValue !== undefined) {
      this.dt2.filterGlobal(inputValue, 'contains'); // Apply global filtering to the table
    }
  }

  // Function to handle the "Add" button click
  openDialogue() {
    this.userForm.reset(); // Clear the form
    this.editUserId = null;
    this.userDialouge = true;
  }

  onSubmit() {
    if (this.userForm.valid) {
      // Handle form submission
      this.managementService
        .postAllData('api/register', this.userForm.value)
        .subscribe({
          next: (res: any) => {
            this.getAllUserList();
            this.userDialouge = false;
            this.toaster.showSuccess('User Created Successfully !...');
          },
          error: (err: any) => {
            this.toaster.showError(err.error.error);
            this.userDialouge = false;
          },
        });
      // console.log(this.userForm.value);
    }
  }

  onUpdate() {
    this.managementService
      .editData('api/updateuser', this.editUserId, this.userForm.value)
      .subscribe({
        next: (res: any) => {
          this.getAllUserList();
          this.userDialouge = false;
          this.toaster.showSuccess('Record Update Successfully !...');
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
          this.userDialouge = false;
        },
      });
  }


  openSupprtDialouge(){
    this.addSupportGroupForm.reset()
    this.addSupportDialog=true
  }
  openRoleDialouge(){
    this.addRoleFormData.reset()
    this.addRoletDialog=true
  }
  openLevelDialouge(){
    this.addLevelFormData.reset()
    this.addLeveleDialog=true
  }

  addSupportGroup(){
  this.managementService.addOptions('api/addsupportgroup',this.addSupportGroupForm.value).subscribe({
    next: (res: any) => {
      this.getSupportGroupList();
     
      this.addSupportDialog=false
      this.toaster.showSuccess('Added Successfully!')

      },
      error:(err:any)=>{
       this.toaster.showWarn(err.error?.error)
        
      }
  })
  }


  addRoles(){
  this.managementService.addOptions('api/adduserroles',this.addRoleFormData.value).subscribe({
    next: (res: any) => {
      this.getUserRole();
   
      this.addRoletDialog=false
      this.toaster.showSuccess('Added Successfully!')

      },
      error:(err:any)=>{
       this.toaster.showWarn(err.error?.error)
        
      }
  })
  }
  addLevels(){
    this.managementService.addOptions('api/addlevel',this.addLevelFormData.value).subscribe({
      next: (res: any) => {
        this.getUserLevel();
        this.addLeveleDialog=false
        this.toaster.showSuccess('Added Successfully!')

      },
      error:(err:any)=>{
       this.toaster.showWarn(err.error?.error)
        
      }
    })
  }
}


