import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';

@Component({
  selector: 'app-change-management',
  templateUrl: './change-management.component.html',
  styleUrls: ['./change-management.component.scss']
})
export class ChangeManagementComponent {

  realTimeSubscription!: Subscription;
aprrovalCount:any
currentRole:any
chatForm!: FormGroup;
  changeManagementDialog: boolean = false;
  changeDetails: any = {}; 
editChangeReqID:any;
  RequestFormData!: FormGroup;
  selectedFile: File | null = null; // Variable to store the selected file
  selectedFileName: string | null = null;
  selectedFiles: File[] = []; // Array to store multiple File objects
  selectedFileNames: { name: string; attachment_id: number }[] = [];
  // editUserId: string | null = null;
  changeReqDialouge: boolean = false;
  ChangeManagementData:any=[] 
  isLoading:boolean=false
  AsignToList:any=[]
  // Dropdown data (You can replace it with your API calls for dynamic data)
  assetTypes = [];
  changeTypes = [];
  priorities = [];
  statuses = [];
  approver = [];
  impactList=[]
  minDate!: Date;
  chatDialogVisible = false;
  changeManageID:any
  newMessage = '';
  messages: any= [];

  // Date format for calendar input
  dateFormat: string = 'yy-mm-dd'; // Customize based on your format
  columns:any=[
    { "field": "id", "header": "ID" },
    { "field": "affected_product_name", "header": "Affected Product" },
  { "field": "implementation_plan", "header": "Implementation Plan" },
 
  { "field": "change_type", "header": "Change Type " },
  { "field": "priority_name", "header": "Priority " },
  { "field": "status_name", "header": "Status " },
  // { "field": "assigned_to_username", "header": "Approver Name" },
  { "field": "scheduled_end_date", "header": " End Date" },
  
 
]
  constructor(
    private fb: FormBuilder,
   
    private managementService:ManagementService,
    private toaster:ToasterService

  ) {

    this.getChangeManagementList()
  }

  ngOnInit(): void {
    const storedUserData = localStorage.getItem('userData');

    // Parse the stored string into an object
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      
      // Access the 'role' property
      this.currentRole= userData.role;
      
     // Output: Administrator
    }
    
    
this.getapprovalCount()
this.getAsignToList()

    this.minDate = new Date(); 
    this.getAffectedProduct()
    this.getChangeType()
    this.getPriority()
    this.getStatus();
    this.getApprover()
    this.getimpactList()
    // Initialize the form
    this.RequestFormData = this.fb.group({
      risk_assessment: ['', Validators.required],
      affected_product_id: ['', Validators.required],
      change_type_id: ['', Validators.required],
      priority_id: ['', Validators.required],
      status_id: ['', Validators.required],
      impact_id: ['', Validators.required],
      description: [''],
      implementation_plan: ['', Validators.required],
      scheduled_start_date: ['',],
      scheduled_end_date: ['', ],
      review_date:[''],
      approver_ids: [[], Validators.required],
      // approval_status_id:[1],
      prev_notes:'',
      log_notes:'',
      assigned_to_id:['',Validators.required]
    });
    
    this.chatForm = this.fb.group({
      message : ['', Validators.required] // 'messageText' field is required
    });



  }

  // Function to load dropdown data (example)
  getChangeManagementList(){
    this.managementService.getAllData('api/getchangemanagement')
    .subscribe({
      next: (res: any) => {
       
        if (res.length > 0) {
          this.ChangeManagementData = res
        } else {
          this.ChangeManagementData = [];
        }
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  getapprovalCount(){
    this.managementService.getAllData('api/getpendingapprovalcount')
    .subscribe({
      next: (res: any) => {
        // console.log(res.pending_approval_count);
        
        this.aprrovalCount=res.pending_approval_count
       
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

getChatList(){
    this.managementService.getUserById('api/getmessage',this.changeManageID)
    .subscribe({
      next: (res: any) => {
     this.messages=res
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  getAffectedProduct(){
    this.managementService
    .getDropdownListData('api/cis')
    .subscribe({
      next: (res: any) => {
        this.assetTypes = res.data;
        // console.log("sada",res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
    
  }

    
  getChangeType(){
    this.managementService
    .getDropdownListData('api/getchangetype')
    .subscribe({
      next: (res: any) => {
        this.changeTypes = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
    
  }
  getPriority(){
    this.managementService
    .getDropdownListData('api/priorities')
    .subscribe({
      next: (res: any) => {
        this.priorities = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
    
  }
  getimpactList(){
    this.managementService
    .getDropdownListData('api/impacts')
    .subscribe({
      next: (res: any) => {
        this.impactList = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });

  }
  getStatus(){
    this.managementService
    .getDropdownListData('api/statuses')
    .subscribe({
      next: (res: any) => {
        this.statuses = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
    
  }
  getApprover(){
    this.managementService
    .getDropdownListData('api/getreporting')
    .subscribe({
      next: (res: any) => {
        this.approver = res;
        // console.log(res);editChangeReqID
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
    
  }
  openDialogue(){
    this.RequestFormData.reset(); 
    this.selectedFiles=[]// Array to store multiple File objects
    this.selectedFileNames= [];  
    this.changeReqDialouge=true
    this.editChangeReqID=''
    this.RequestFormData.patchValue({ status_id: 1 });
  }
  // Function to handle file selection
  onFileSelect(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if the file is already selected
        const alreadySelected = this.selectedFileNames.some(fileName => fileName.name === file.name);
        
        if (!alreadySelected) {
            this.selectedFiles.push(file); // Store file objects in the array
            this.selectedFileNames.push({ name: file.name, attachment_id: 0 }); // Store file names for display
        }
    }
}


  
  removeFile(index: number,attachment_id:number) {
    // console.log("index ",index, "attachment_id ",attachment_id);
    
    this.selectedFileNames.splice(index, 1);
    this.selectedFiles.splice(index, 1); // Remove the corresponding file object as well


    if(attachment_id != 0){
      this.managementService.deleteDataById('api/deletechangeattachment',attachment_id).subscribe(res=>{
// console.log('delete successfully');

      })

    }
  }

  



// Function to save new change request

submitChangeReq() {
  if (this.RequestFormData.invalid) {
    // Handle form invalid case, maybe return or show an error
    return;
  }

  this.isLoading=true
  const formData = new FormData(); // Create a FormData object
  const formValue = { ...this.RequestFormData.value }; // Get form values

  // Append dynamic values from the form
  formData.append('risk_assessment', formValue.risk_assessment);
  formData.append('affected_product_id', formValue.affected_product_id.toString()); // Convert to string if needed
  formData.append('change_type_id', formValue.change_type_id.toString());
  formData.append('priority_id', formValue.priority_id.toString());
  formData.append('status_id', formValue.status_id.toString());
  formData.append('impact_id', formValue.impact_id.toString());
  formData.append('description', formValue.description || ''); // Fallback to empty string if null
  formData.append('implementation_plan', formValue.implementation_plan);
  formData.append('assigned_to_id', formValue.assigned_to_id.toString());
  // formData.append('log_notes', formValue.log_notes);
  // Format the dates properly before appending
  const scheduledStartDate = this.convertToLocalDate(formValue.scheduled_start_date);
  const scheduledEndDate = this.convertToLocalDate(formValue.scheduled_end_date);
  const reviewDate = this.convertToLocalDate(formValue.review_date);

  // Append date values only if they are not null
  if (scheduledStartDate) {
    formData.append('scheduled_start_date', scheduledStartDate);
  }
  
  if (scheduledEndDate) {
    formData.append('scheduled_end_date', scheduledEndDate);
  }

  if (reviewDate) {
    formData.append('review_date', reviewDate);
  }

  // Handle approver_ids, assuming it can be a single ID or an array
  if (Array.isArray(formValue.approver_ids)) {
    formValue.approver_ids.forEach((id: any) => formData.append('approver_ids', id.toString())); // Convert each ID to string
  } else if (formValue.approver_ids) {
    formData.append('approver_ids', formValue.approver_ids.toString()); // Append as string if not an array
  }

  // Append approval_status_id and prev_notes with fallback to empty string if null
  // formData.append('approval_status_id', formValue.approval_status_id !== null ? formValue.approval_status_id.toString() : '');
  // formData.append('prev_notes', formValue.prev_notes !== null ? formValue.prev_notes : '');

  // Handle file attachment
  if (this.selectedFiles && this.selectedFiles.length > 0) {
    this.selectedFiles.forEach((file: File, index: number) => {
      formData.append('attachment', file); // Append each file
    });
  }


  // Make your HTTP POST request with the FormData object
  this.managementService.postAllData('api/addchangemanagement', formData).subscribe(
    (response: any) => {
      this.isLoading=false
      this.toaster.showSuccess('Successfully created!');
      this.changeReqDialouge = false; // Close the dialog
      this.getChangeManagementList(); // Refresh the list
      this.RequestFormData.reset(); // Reset the form
      this.getapprovalCount()
    },
    (error: any) => {
      this.isLoading=false
      this.toaster.showError(error.error?.error);
    }
  );
}

// Convert date to local format
convertToLocalDate(date: string | Date): string | null {
  if (!date) return null;

  // Ensure date is a Date object
  const selectedDate = new Date(date);

  // Correct for timezone issues by getting local time
  const localDateString = selectedDate.toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD format
  return localDateString;
}

getAsignToList() {
  this.managementService.getDropdownListData('api/getreporting').subscribe({
    next: (res: any) => {
      this.AsignToList = res;
      // console.log(res);
    },
    error: (err: any) => {
      this.toaster.showError(err.error.error);
    },
  });
}


  // Function to update existing change request
  onUpdate() {
    if (this.RequestFormData.invalid) {
    
      return;
    }
    this.isLoading=true
  const formData = new FormData(); // Create a FormData object
  const formValue = { ...this.RequestFormData.value }; // Get form values

  // Append dynamic values from the form
  formData.append('risk_assessment', formValue.risk_assessment);
  formData.append('affected_product_id', formValue.affected_product_id.toString()); // Convert to string if needed
  formData.append('change_type_id', formValue.change_type_id.toString());
  formData.append('priority_id', formValue.priority_id.toString());
  formData.append('status_id', formValue.status_id.toString());
  formData.append('impact_id', formValue.impact_id.toString());
  formData.append('description', formValue.description || ''); // Fallback to empty string if null
  formData.append('implementation_plan', formValue.implementation_plan);
  formData.append('log_notes', formValue.log_notes||'');
  if(formValue.assigned_to_id){

    formData.append('assigned_to_id', formValue.assigned_to_id);
  }
  // formData.append('prev_notes', formValue.prev_notes);
  // Format the dates properly before appending
  const scheduledStartDate = this.convertToLocalDate(formValue.scheduled_start_date);
  const scheduledEndDate = this.convertToLocalDate(formValue.scheduled_end_date);
  const reviewDate = this.convertToLocalDate(formValue.review_date);

  // Append date values only if they are not null
  if (scheduledStartDate) {
    formData.append('scheduled_start_date', scheduledStartDate);
  }
  
  if (scheduledEndDate) {
    formData.append('scheduled_end_date', scheduledEndDate);
  }

  if (reviewDate) {
    formData.append('review_date', reviewDate);
  }

  // Handle approver_ids, assuming it can be a single ID or an array
  if (Array.isArray(formValue.approver_ids)) {
    formValue.approver_ids.forEach((id: any) => formData.append('approver_ids', id.toString())); // Convert each ID to string
  } else if (formValue.approver_ids) {
    formData.append('approver_ids', formValue.approver_ids.toString()); // Append as string if not an array
  }

  if (this.selectedFiles && this.selectedFiles.length > 0) {
    this.selectedFiles.forEach((file: File, index: number) => {
      formData.append('attachment', file); // Append each file
    });
  }



    // Make HTTP PUT request to update the form data
    this.managementService.editData('api/updatechangemanagement',this.editChangeReqID, formData).subscribe(
      (response) => {
        this.isLoading=false
        this.getChangeManagementList()
        this.changeReqDialouge = false; // Close the dialog
        this.RequestFormData.reset();   // Reset the form
        this.getapprovalCount()
      },
      (error) => {
        this.isLoading=false
   this.toaster.showError(error.error?.error)
      }
    );
  }

  openEditDialogue(data: any) {
    
    this.selectedFiles=[]// Array to store multiple File objects
    this.selectedFileNames= [];  
    // console.log('editData', data);  // Ensure this logs the correct data, including affected_product_id
    this.editChangeReqID = data.id;
    this.changeReqDialouge = true;
    this.RequestFormData.reset()
    const approverIds = data.approvers?.map((approver: any) => (approver.user_approver_id)) || [];

  
    // Helper function to convert date from 'DD/MM/YYYY' to Date object
    const parseDate = (dateStr: string) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split('/');
      const date = new Date(+year, +month - 1, +day);
      // Set time to noon to avoid any time zone issues (since time zones can push the date backward)
      date.setHours(12, 0, 0, 0); 
      return date;
    };
  
    // Patch the values from the data object to the form
    this.RequestFormData.patchValue({
      risk_assessment: data.risk_assessment || '',  
      affected_product_id: data.affected_product_id ? (data.affected_product_id) : '',
      change_type_id: data.change_type_id || '',
      priority_id: data.priority_id || '',
      status_id: data.status_id || '',
      impact_id: data.impact_id || '',
      description: data.description || '',
      implementation_plan: data.implementation_plan || '',
      scheduled_start_date: parseDate(data.scheduled_start_date),  // Convert to Date object
      scheduled_end_date: parseDate(data.scheduled_end_date), 
      review_date: parseDate(data.review_date),      // Convert to Date object
      approver_ids: approverIds ,
      assigned_to_id:data.assigned_to_id||'',          // Assuming approver_id is an array
      // created_by_username: data.created_by_username || '',  // Patch created_by_username
      prev_notes: data.log_notes && data.log_notes.length > 0
        ? data.log_notes.map((note: any) => `Assign To: ${note.created_by_username}\nNote:  ${note.log_note}`).join('\n')
        : ''
    });

    if (data.attachment && data.attachment.length > 0) {
      this.selectedFileNames = []; // Clear previous selections
      
      data.attachment.forEach((attachment: any) => {
        const fileName = attachment.file_path.split('/').pop(); // Extract the file name from the path
        // Push an object containing the file name and attachment ID
        this.selectedFileNames.push({ name: fileName, attachment_id: attachment.attachment_id });
      });
    } else {
      this.selectedFileNames = []; // Clear the array if no files are present
      this.selectedFileNames.push({ name: 'No file selected', attachment_id: 0 }); // Set default message
    }
  }

  downloadAttachment(filePath: string | undefined) {
    if (!filePath) {
        console.warn("No valid file path provided for download.");
        return; // Exit if the file path is invalid
    }

    // Fetch the file as a blob
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch the file. Status: ${response.status}`);
            }
            return response.blob(); // Convert response to Blob
        })
        .then(blob => {
            const url = URL.createObjectURL(blob); // Create a URL for the Blob

            // Create a link element to trigger download
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from the path or default to 'download'
            const fileName = filePath.split('/').pop() || 'download';
            link.setAttribute('download', fileName);

            // Append link to the body and trigger the download
            document.body.appendChild(link);
            link.click();

            // Cleanup: Remove link and revoke the object URL after the download is triggered
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Clean up the Blob URL
            // console.log(`File download initiated: ${fileName}`);
        })
        .catch(error => {
            console.error("Error during download:", error);
        });
}



  
  openAttachment(filePath: string) {
    // console.log(filePath);
    
    window.open(filePath, '_blank'); // Opens the attachment in a new tab
}

  openChangeReqDetails(data:any){

    this.changeDetails = data;
      

    // Open the dialog
    this.changeManagementDialog = true;
    // console.log('view Details',data);
    if( this.changeDetails){
  this.changeManageID= this.changeDetails?.id
    }
    
   
    this.getChatList();
  }
  getStatusClass(statusName: string): string {
    // console.log(statusName.toLowerCase());
    
    switch (statusName.toLowerCase()) {
      case 'open': return 'status-open';
      case 'close': return 'status-closed';
      case 'on hold': return 'status-on-hold';
      case 'in progress': return 'status-in-progress';
      default: return '';
    }
  }

  showChatDialog() {
    this.realTimeSubscription = interval(5000).subscribe(() => {
      this.getChatList();
    });
    this.chatDialogVisible = true;
  }

  sendMessage() {


this.managementService.postDataByID('api/addmessage',this.changeManageID,this.chatForm.value).subscribe({
  next:(res:any)=>{
//  alert('send message')
  this.chatForm.reset()
 this.getChatList()
  },
 
})

  
  }

  ngOnDestroy() {
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe();
    }
  }
  closeChat(){
    this.chatDialogVisible = false
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe();
    }
  }
}