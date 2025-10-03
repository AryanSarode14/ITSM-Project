import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';

@Component({
  selector: 'app-approval-request',
  templateUrl: './approval-request.component.html',
  styleUrls: ['./approval-request.component.scss']
})
export class ApprovalRequestComponent {
  currentUserId:any
  approvalFormData!:FormGroup
  approvalRequests:any=[]
  status: string = 'Approved'; // Default status for initial tab load
  response:any=''
  reqID:any;  

  loadingBtn:boolean=false
  rejectDialogVisible: boolean = false;


  constructor(  private managementService:ManagementService,
    private toaster:ToasterService,    private fb: FormBuilder,) {
      const userData = localStorage.getItem('userData'); // Replace 'yourStorageKey' with the actual key
      if (userData) {
        const parsedData = JSON.parse(userData); // Parse the JSON string into an object
        this.currentUserId = parsedData.userId || null; // Set the userId or null if it doesn't exist
      } else {
        this.currentUserId = null; // Set to null if no data found
      }
  
      // console.log('Current User ID:', this.currentUserId); // Log the current user ID
    
     }

 ngOnInit(){
  this.getallApprovalRequest(this.status)
  this.approvalFormData=this.fb.group({
    reason:'',
    approval_status_id:''
  })
 }

// getallApprovalRequest(){
//   this.managementService.getAllData('api/getchangemanagementbyuser')
//   .subscribe({
//     next: (res: any) => {
     
//       if (res.length > 0) {
//         this.approvalRequests = res
//       } else {
//         this.approvalRequests = [];
//       }
//     },
//     error: (err: any) => {
//       this.toaster.showError(err.error.error);
//     },
//   });

// }


getallApprovalRequest(status: string) {
  let apiEndpoint: string;

  // Decide the API endpoint or filter based on the selected tab status
  switch (status) {
    case 'Approved':
      apiEndpoint = 'api/getapprovedchangemanagement';
      break;
    case 'Pending':
      apiEndpoint = 'api/getpendingchangemanagement';
      break;
    case 'Rejected':
      apiEndpoint = 'api/getrejectedchangemanagement';
      break;
    default:
      apiEndpoint = 'api/getchangemanagementbyuser';
      break;
  }

  this.managementService.getAllData(apiEndpoint)
    .subscribe({
      next: (res: any) => {
        if (res.length > 0) {
          this.approvalRequests = res;
        } else {
          this.approvalRequests = [];
        }
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
}

  approveRequest(id: any) {

    this.approvalFormData.patchValue({
      approval_status_id: 2
    });

    this.managementService.editData('api/giveapproval',id, this.approvalFormData.value).subscribe(
      (response) => {
        this.getallApprovalRequest(this.status);
        this.rejectDialogVisible = false;
        this.loadingBtn=false
      },
      (error) => {
   this.toaster.showError(error.error?.error);
   this.rejectDialogVisible = false;
   this.loadingBtn=false
      }
    );
  }
  
  rejectRequest(id: any) {
   
    this.approvalFormData.patchValue({
      approval_status_id: 3
    });

    this.managementService.editData('api/giveapproval',id, this.approvalFormData.value).subscribe(
      (response) => {
        this.getallApprovalRequest(this.status)
        this.rejectDialogVisible = false;
        this.loadingBtn=false
      },
      (error) => {
   this.toaster.showError(error.error?.error)
   this.rejectDialogVisible = false;
   this.loadingBtn=false

      }
    );
  }

  onTabChange(status: string) {
    this.status = status;
    this.getallApprovalRequest(this.status); // Fetch requests based on the new status
  }

  openRejectDialog(id:any,response:any) {
    this.reqID=id;
    this.response=response;
   
    this.approvalFormData.reset()
  
 
    const reasonControl = this.approvalFormData.get('reason');

    if (reasonControl) {
      if (this.response === 'reject') {
        // Add the required validator to the 'reason' field for 'reject' response
        reasonControl.setValidators([Validators.required]);
      } else if (this.response === 'approve') {
        // Remove the required validator for 'approve' response
        reasonControl.clearValidators();
      }
  
      // Update the form validity after changing validators
      reasonControl.updateValueAndValidity();
    }
  
    this.rejectDialogVisible = true;
  }

  submitRejection() {

    this.loadingBtn=true
if(this.response=='approve'){
  this.approveRequest(this.reqID)
}else if(this.response=='reject'){
  this.rejectRequest(this.reqID)
}
  }

}