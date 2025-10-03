import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-incident',
  templateUrl: './incident.component.html',
  styleUrls: ['./incident.component.scss'],
})
export class IncidentComponent {
  currentUserId: any;
  incidentFormData!: FormGroup;
  customers!: any[];
  AllTickets: any = [];
  myTickets: any = [];
  groupedTickets: any = [];
  assignTickets: any = [];
  onHoldTickets: any = [];
  closedTickets: any = [];
  selectedTab: any = 'allTickets';
  incidenceDialouge: boolean = false;
  incidenceDialouge2: boolean = false;
  AffectedProductList: any[] = [];
  // ServiceNameList=[{
  //   role_id:23,
  // }];
  editUserId: any;
  representatives!: any[];
  timeSlot!: any[];
  // statuses!: any[];
  callMode: any = [];
  statusList: any = [];
  callTypeList: any = [];
  SLAList: any = [];
  empNameList: any = [];
  affectedProductList: any = [];
  supportGroupList: any = [];
  priorityList: any = [];
  // loading: boolean = false;

  activityValues: number[] = [0, 100];
  selectedRepresentative: any;
  selectTimeSlot: any;
  displayModal = false; // Control modal visibility
  selectedIncident: any;
  selectedFileName: string | null = null; 
  uploadedAttachments: { name: string; url: string }[] = [];


  callTypeDialog:boolean=false
  callTypeFormData!:FormGroup

  slaDialog:boolean=false
  slaFormData!:FormGroup

  selectedFile: File | null = null;
  columns = [
    { field: 'incident_id', header: 'Ticket ID' },
    { field: 'issue_description', header: 'Issue' },
    { field: 'initiated_for_user_name', header: 'Owner Name' },
    { field: 'user_assigned_to_name', header: 'Assign To ' },
    { field: 'support_group_name', header: 'Support Group' },
    { field: 'ci_detail_name', header: 'Asset Name' },
    { field: 'call_mode', header: 'Call Mode' },
    { field: 'status_name', header: 'Status' },
    // { field: 'priority', header: 'Priority' }
  ];
  columns1 = [
    { field: 'incident_id', header: 'Ticket ID' },
    { field: 'issue_description', header: 'Issue' },
    { field: 'initiated_for_user_name', header: 'Owner Name' },
    { field: 'user_assigned_to_name', header: 'Assign To ' },
    { field: 'support_group_name', header: 'Support Group' },
    { field: 'ci_detail_name', header: 'Asset Name' },
    { field: 'call_mode', header: 'Call Mode' },
    { field: 'status_name', header: 'Status' },
    // { field: 'priority', header: 'Priority' }
  ];
  columns3 = [
    { field: 'incident_id', header: 'Ticket ID' },
    { field: 'issue_description', header: 'Issue' },
    { field: 'initiated_for_user_name', header: 'Owner Name' },
    { field: 'support_group_name', header: 'Support Group' },
    { field: 'ci_detail_name', header: 'Asset Name' },
    { field: 'call_mode', header: 'Call Mode' },
    { field: 'status_name', header: 'Status' },
    // { field: 'priority', header: 'Priority' }
  ];
  isCallModeReadOnly: boolean = false;
  logNotes: any;
  constructor(
    private fb: FormBuilder,
    private managementService: ManagementService,
    private cdr: ChangeDetectorRef,
    private toaster: ToasterService
  ) {
    this.fetchAllTickets();
    const userdata = localStorage.getItem('userData');
    // console.log(userdata);

    // Check if userData exists
    if (userdata) {
      // Parse the string into an object
      const user = JSON.parse(userdata);

      // Access the user ID (assuming it's stored under 'user_id')
      this.currentUserId = user.current_user_id; // Adjust the key to match your structure
    }
  }

  ngOnInit() {
    this.getCallMode();
    this.getstatusList();
    this.getCallTypeList();
    this.getSLAList();
    this.getEmpNameList();
    // this. getProductList()
    this.getGroupList();
    this.getpriorityList();

    this.incidentFormData = this.fb.group({
      issue_description: ['', Validators.required],
      sla_id: ['', Validators.required],
      call_type_id: ['', Validators.required],
      initiated_for_user_id: ['', Validators.required],
      support_group_id: ['', Validators.required],
      ci_details_id: ['', Validators.required],
      status_id: [3, Validators.required],
      call_mode_id: ['', Validators.required],
      priority_id: ['', Validators.required],
      user_assigned_to_id: [],
      log_notes: [''],
      prev_note: [''],
      attachment: [null] // Add attachment field
    });

    this.callTypeFormData=this.fb.group({
      call_type_name:['', Validators.required],
    })

    this.slaFormData=this.fb.group({
      sla_time:['', Validators.required],
    })

    this.timeSlot = [
      { name: 'Last 7 Days' },
      { name: 'Last 14 Days' },
      { name: 'Last 21 Days' },
    ];
    this.selectTimeSlot = this.timeSlot[0];
  }

  getCallMode() {
    this.managementService.getDropdownListData('api/call_modes').subscribe({
      next: (res: any) => {
        this.callMode = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  getstatusList() {
    this.managementService.getDropdownListData('api/statuses').subscribe({
      next: (res: any) => {
        this.statusList = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  getCallTypeList() {
    this.managementService.getDropdownListData('api/call_types').subscribe({
      next: (res: any) => {
        this.callTypeList = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  getSLAList() {
    this.managementService.getDropdownListData('api/slas').subscribe({
      next: (res: any) => {
        this.SLAList = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  getEmpNameList() {
    this.managementService.getDropdownListData('api/getreporting').subscribe({
      next: (res: any) => {
        this.empNameList = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  getGroupList() {
    this.managementService
      .getDropdownListData('api/support_group_details')
      .subscribe({
        next: (res: any) => {
          this.supportGroupList = res;
          // console.log(res);
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
        },
      });
  }

  getpriorityList() {
    this.managementService.getDropdownListData('api/priorities').subscribe({
      next: (res: any) => {
        this.priorityList = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.incidentFormData.patchValue({
        attachment: file
      });
      this.selectedFileName = file.name; // Set the selected file name
    } else {
      this.selectedFileName = null; // Clear if no file selected
    }
  }
  

  openDialogue() {
    this.editUserId = null;
  
    // Reset the form
    this.selectedFileName = null;
    this.incidentFormData.reset();
    this.uploadedAttachments = [];
  
    // Assuming 'Open' has an ID of 1 in your statusList
    const openStatus = this.statusList.find((status: { status_name: string; }) => status.status_name === 'Open');
    const callMode = this.callMode.find((callmode: { mode: string; }) => callmode.mode === 'web');
    const callModePhone = this.callMode.find((callmode: { mode: string; }) => callmode.mode === 'phone');
  
    // Patch the form with the 'Open' status ID and disable the dropdown
    this.incidentFormData.patchValue({
      status_id: openStatus?.id || null, // Use the ID for 'Open' or null if not found
      call_mode_id: window.innerWidth <= 768 ? callModePhone?.id : callMode?.id,
    });
  
    this.isCallModeReadOnly = true;
  
    // Open the dialog
    this.incidenceDialouge = true;
  }
  onSubmit() {
    if (this.incidentFormData.valid) {
      const formData = new FormData();
      
      // Append form values
      Object.keys(this.incidentFormData.value).forEach(key => {
        formData.append(key, this.incidentFormData.value[key]);
      });
  
      this.managementService.postAllData('api/createincidents', formData).subscribe({
        next: (res: any) => {
          this.incidenceDialouge = false;
          // Handle success as before
          if (this.selectedTab == 'allTickets') {
            this.fetchAllTickets();
          } else if (this.selectedTab == 'myTickets') {
            this.fetchMyTickets();
          } else if (this.selectedTab == 'groupTickets') {
            this.fetchGroupedTickets();
          } else if (this.selectedTab == 'assignTickets') {
            this.fetchAssignedTickets();
          } else if (this.selectedTab == 'onholdTickets') {
            this.fetchOnHoldTickets();
          } else if (this.selectedTab == 'closeTickets') {
            this.fetchClosedTickets();
          }
          this.toaster.showSuccess('Submitted Successfully');
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
          this.incidenceDialouge = false;
        },
      });
    }
  }
  
  
  // onSubmit() {
  //   if (this.incidentFormData) {
  //     // console.log(this.incidentFormData.value);

  //     this.managementService
  //       .postAllData('api/createincidents', this.incidentFormData.value)
  //       .subscribe({
  //         next: (res: any) => {
  //           this.incidenceDialouge = false;
  //           // console.log('selectedTab', this.selectedTab);
  //           if (this.selectedTab == 'allTickets') {
  //             this.fetchAllTickets();
  //           } else if (this.selectedTab == 'myTickets') {
  //             this.fetchMyTickets();
  //           } else if (this.selectedTab == 'groupTickets') {
  //             this.fetchGroupedTickets();
  //           } else if (this.selectedTab == 'assignTickets') {
  //             this.fetchAssignedTickets();
  //           } else if (this.selectedTab == 'onholdTickets') {
  //             this.fetchOnHoldTickets();
  //           } else if (this.selectedTab == 'closeTickets') {
  //             this.fetchClosedTickets();
  //           }
  //           this.toaster.showSuccess(' Submitted Successfully');
  //         },
  //         error: (err: any) => {
  //           this.toaster.showError(err.error.error);
  //           this.incidenceDialouge = false;
  //         },
  //       });
  //   }
  // }

  onTabChange(event: any) {
    const tabIndex = event.index;

    switch (tabIndex) {
      case 0:
        this.selectedTab = 'allTickets';
        this.fetchAllTickets();

        break;
      case 1:
        this.selectedTab = 'myTickets';
        this.fetchMyTickets();
        break;
      case 2:
        this.selectedTab = 'groupTickets';
        this.fetchGroupedTickets();
        break;
      case 3:
        this.selectedTab = 'assignTickets';
        this.fetchAssignedTickets();
        break;
      case 4:
        this.selectedTab = 'onholdTickets';
        this.fetchOnHoldTickets();
        break;
      case 5:
        this.selectedTab = 'closeTickets';
        this.fetchClosedTickets();
        break;
    }
  }
  onEmployeeChange(id: any) {
    // console.log('userId', id);
    this.managementService.getAllData(`api/cidetails/${id}`).subscribe({
      next: (res: any) => {
        if(res.status==200){
        this.AffectedProductList = res.data;
        // this.toaster.showSuccess(res.message);
        }
        else if(res.status==204)
        {
          this.toaster.showInfo(res.message);
        }
        // this.toaster.showSuccess(res.message)
        // console.log("res",res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  fetchAllTickets() {
    this.managementService.getAllData('api/incidents').subscribe({
      next: (res: any) => {
        if (res.length > 0) {
          this.AllTickets = res;
        } else {
          this.AllTickets = [];
        }
        // this.toaster.showSuccess(res.message)
        // console.log("res",res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  fetchMyTickets() {
    this.managementService
      .getAllData(`api/mytickets`)
      .subscribe({
        next: (res: any) => {
          if (res.length > 0) {
            this.myTickets = res;
          } else {
            this.myTickets = [];
          }
          // this.toaster.showSuccess(res.message)
          // console.log("res",res);
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
        },
      });
  }

  fetchGroupedTickets() {
    this.managementService.getAllData(`api/getincidentbysupport`).subscribe({
      next: (res: any) => {
        if (res.length > 0) {
          this.groupedTickets = res;
        } else {
          this.groupedTickets = [];
        }
        // this.toaster.showSuccess(res.message)
        // console.log("res",res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  fetchAssignedTickets() {
    this.managementService.getAllData('api/incidentassigned').subscribe({
      next: (res: any) => {
        if (res.length > 0) {
          this.assignTickets = res;
        } else {
          this.assignTickets = [];
        }
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  fetchOnHoldTickets() {
    this.managementService.getAllData('api/onhold').subscribe({
      next: (res: any) => {
        if (res.length > 0) {
          this.onHoldTickets = res;
          // this.cdr.detectChanges();
        } else {
          this.onHoldTickets = [];
        }

        // this.toaster.showSuccess(res.message)
        // console.log("res",res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  fetchClosedTickets() {
    this.managementService.getAllData('api/getClosedIncident').subscribe({
      next: (res: any) => {
        if (res.length > 0) {
          this.closedTickets = res;
          this.cdr.detectChanges();
        } else {
          this.closedTickets = [];
        }
        // this.toaster.showSuccess(res.message)
        // console.log("res",res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  onUpdate() {
    const formData = new FormData(); // Create a new FormData object
  
    // Append form fields to the FormData object
    formData.append('issue_description', this.incidentFormData.value.issue_description);
    formData.append('sla_id', this.incidentFormData.value.sla_id);
    formData.append('call_type_id', this.incidentFormData.value.call_type_id);
    formData.append('initiated_for_user_id',this.incidentFormData.value.initiated_for_user_id);
    formData.append('support_group_id', this.incidentFormData.value.support_group_id);
    formData.append('ci_details_id', this.incidentFormData.value.ci_details_id);
    formData.append('status_id', this.incidentFormData.value.status_id);
    formData.append('call_mode_id', this.incidentFormData.value.call_mode_id);
    formData.append('priority_id', this.incidentFormData.value.priority_id);
    if(this.incidentFormData.value.user_assigned_to_id){

      formData.append('user_assigned_to_id', this.incidentFormData.value.user_assigned_to_id);
    }
    if(this.incidentFormData.value.log_notes){

      formData.append('log_notes', this.incidentFormData.value.log_notes);
    }
    // formData.append('prev_note', this.incidentFormData.value.prev_note);
  
    // Append the attachment if there is one
    if (this.incidentFormData.value.attachment) {
      formData.append('attachment', this.incidentFormData.value.attachment); // Key name should match your API expectation
    }
  
    this.managementService
      .editData('api/updateincident', this.editUserId, formData)
      .subscribe({
        next: (res: any) => {
          // Handle successful response
          if (this.selectedTab === 'allTickets') {
            this.fetchAllTickets();
            this.cdr.detectChanges();
          } else if (this.selectedTab === 'myTickets') {
            this.fetchMyTickets();
          } else if (this.selectedTab === 'groupTickets') {
            this.fetchGroupedTickets();
          } else if (this.selectedTab === 'assignTickets') {
            this.fetchAssignedTickets();
          } else if (this.selectedTab === 'onholdTickets') {
            this.fetchOnHoldTickets();
          } else if (this.selectedTab === 'closeTickets') {
            this.fetchClosedTickets();
          }
          this.incidenceDialouge = false;
          this.toaster.showSuccess('Record Updated Successfully !...');
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
          this.incidenceDialouge = false;
        },
      });
  }

  openEditDialogue(rowData: any) {
    this.incidentFormData.reset();
    this.selectedFileName = null;
    this.editUserId = rowData?.incident_id;
    this.incidenceDialouge = true;
  
    // Fetch incident details using the incident ID
    this.managementService
      .getDropdownListData(`api/incidents/${this.editUserId}`)
      .subscribe({
        next: (res: any) => {
          const incidentData = res?.data?.incident;
          const logNotesData = res?.data?.logNotes;
          //  console.log("sdd",logNotesData);
           
          // Reset uploaded attachments
          this.uploadedAttachments = [];
  
          // Check if there is an attachment and populate the array
          if (incidentData?.attachment) {
            const url = incidentData.attachment; // The URL string
            const name = url.substring(url.lastIndexOf('/') + 1); // Extract the file name from the URL
  
            this.uploadedAttachments.push({ name, url }); // Add to the attachments array
          }
  
          // Other existing logic...
          const empID = incidentData?.initiated_for_user_id;
  
          setTimeout(() => {
            this.onEmployeeChange(empID);
          }, 50);
  
          setTimeout(() => {
            const formattedLogNotes = logNotesData.map((note: { note: string; created_at: string }, index: number) => {
              const [datePart, timePart] = note.created_at.split(' '); // Split date and time
              const [day, month, year] = datePart.split('/'); // Split day, month, and year
          
              // Manually construct the date string in a supported format (MM/DD/YYYY HH:mm)
              const formattedDate = new Date(`${year}-${month}-${day}T${timePart}`).toLocaleString();
          
              return `${index + 1}. ${note.note} (${formattedDate})`;
          }) .join('\n');
  
            this.incidentFormData.patchValue({
              issue_description: incidentData?.issue_description || '',
              sla_id: incidentData?.sla_id || '',
              call_type_id: incidentData?.call_type_id || '',
              initiated_for_user_id: incidentData?.initiated_for_user_id ? incidentData?.initiated_for_user_id: '',
              support_group_id: incidentData?.support_group_id || '',
              ci_details_id: incidentData?.ci_details_id || '',
              status_id: incidentData?.status_id || '',
              call_mode_id: incidentData?.call_mode_id || '',
              priority_id: incidentData?.priority_id || '',
              user_assigned_to_id: incidentData?.user_assigned_to_id ? incidentData?.user_assigned_to_id : '',
              prev_note: formattedLogNotes || '',
            });
            this.incidentFormData.get('status_id')?.enable();
            this.incidentFormData.get('call_mode_id')?.enable();
  
            // Open the dialog after patching the form
            this.incidenceDialouge = true;
          }, 500);
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
        },
      });

  }

  viewAttachment(attachment: { name: string; url: string }) {
    window.open(attachment.url, '_blank');
  }
  
  removeAttachment(attachment: { name: string; url: string }) {
    // Call your API delete method, passing the attachment's URL
    this.managementService.deleteprofileUpload(`/deleteincidentattachment/${attachment.url}`).subscribe(
      (response: any) => {
        if (response.status === 200) {
          // Remove the attachment from the array if deletion is successful
          this.uploadedAttachments = this.uploadedAttachments.filter(a => a.url !== attachment.url);
          this.toaster.showSuccess('Attachment removed successfully');
        } else {
          this.toaster.showError('Failed to remove the attachment');
        }
      },
      (error) => {
        this.toaster.showError('Error occurred while deleting the attachment');
      }
    );
  }
  
  
  


  // Assuming you have these properties defined in your component
  incidentDetails: any = {};

  openIncidentDetails(incident: any) {
    this.editUserId = incident.incident_id; // Get the incident ID

    // Fetch incident details using the incident ID
    this.managementService
      .getDropdownListData(`api/incidents/${this.editUserId}`)
      .subscribe({
        next: (res: any) => {
          // console.log('Incident details:', res);
          this.incidentDetails = res.data.incident; // Store the fetched incident details
          this.logNotes = res?.data.logNotes;
       
          
          this.incidenceDialouge2 = true; // Open the modal
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
        },
      });
  }

  // Method to close the modal
  closeModal() {
    this.incidenceDialouge2 = false;
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'Open':
        return 'Open';
      case 'Close':
        return 'Closed';
      case 'Pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Open':
        return 'status-label open';
      case 'Close':
        return 'status-label closed';
      case 'Pending':
        return 'status-label pending';
      default:
        return '';
    }
  }

  callTypeDialouge(){
    this.callTypeFormData.reset()
    this.callTypeDialog=true
  }
  addCallTypes(){
    this.managementService.addOptions('api/addcalltype',this.callTypeFormData.value).subscribe({
      next: (res: any) => {
        this.getCallTypeList();
        this.callTypeDialog=false
        this.toaster.showSuccess('Added Successfully!')

      },
      error:(err:any)=>{
       this.toaster.showWarn(err.error?.error)
        
      }
    })
  }

 slaDialouge(){
  this.slaFormData.reset()
    this.slaDialog=true
  }
  addSla(){
    this.managementService.addOptions('api/addsla',this.slaFormData.value).subscribe({
      next: (res: any) => {
        this.getSLAList();
        this.slaDialog=false
        this.toaster.showSuccess('Added Successfully!')

      },
      error:(err:any)=>{
       this.toaster.showWarn(err.error?.error)
        
      }
    })
  }
}
