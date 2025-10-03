import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicTableComponent } from 'src/app/globle_Component/dynamic-table/dynamic-table.component';
import { AssetsService } from 'src/app/Services/assets.service';
import { HrmanagementService } from 'src/app/Services/hrmanagement.service';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';

@Component({
  selector: 'app-hr-management',
  templateUrl: './hr-management.component.html',
  styleUrls: ['./hr-management.component.scss'],
})
export class HrManagementComponent {
  customers!: any[];
  hrincidentform!: FormGroup;

  hrRequestDialouge: boolean = false;
  @ViewChild('dynamictable') dynmaictable!: DynamicTableComponent;
  representatives!: any[];
  timeSlot!: any[];
  statuses!: any[];

  loading: boolean = false;

  activityValues: number[] = [0, 100];
  selectedRepresentative: any;
  selectedTab: any = 'myTickets';

  selectTimeSlot: any;
  columns = [
    { field: 'hr_id', header: 'Ticket ID' },
    { field: 'issue_desc', header: 'Issue Description' },
    { field: 'mode', header: 'Call Mode' },
    { field: 'status_name', header: 'Status' },
    { field: 'call_type_name', header: 'Call Type' },
    { field: 'sla_time', header: 'SLA' },
    { field: 'service_name', header: 'Service' },
    { field: 'support_group_name', header: 'Support Group' },
  ];

  // Sample data for different tabs
  myTickets = []; // Replace with your data source
  groupedTickets = [];
  allTickets = [];
  holdTickets = [];
  closedTickets = [];
  openTickets = [];
  data = [];
  callmodes: any;
  allstatus: any;
  calltypes: any;
  allslas: any;
  supportgroups: any;
  services: any;
  userid: any;
  affectedproducts: any;
  editUserId: any;
  hrincidents = [];
  inProgress: any;
  onHold: any;
  assignedTo: any;
  users: any;
  activeTabIndex: number = 0;
  isCallModeReadOnly: boolean = false;

  slaDialog: boolean = false;
  slaFormData!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private managementService: ManagementService,
    private toaster: ToasterService,
    private hrincident: HrmanagementService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Get userData from localStorage
    const userDataString = localStorage.getItem('userData');

    if (userDataString) {
      // Parse userData as JSON
      const userData = JSON.parse(userDataString);

      // Extract current_user_id
      this.userid = userData.user_id;

      // console.log('User ID:', this.userid); // Outputs: 1047
    }
    this.representatives = [
      { name: 'All Tickets', image: 'pi pi-bookmark-fill', severity: 'Info' },
      { name: 'My Tickets', image: 'pi pi-user', severity: 'Info' },
      { name: 'Grouped Tickets', image: 'pi pi-users', severity: 'success' },
      {
        name: 'Assigned Tickets',
        image: 'pi pi-hourglass',
        severity: 'success',
      },
      {
        name: 'Re-scheduled Tickets',
        image: 'pi pi-refresh',
        severity: 'Info',
      },
      {
        name: 'On-Hold Tickets',
        image: 'pi pi-stop-circle',
        severity: 'danger',
      },
      { name: 'closed Tickets', image: 'pi pi-stop', severity: 'warning' },
    ];

    this.timeSlot = [
      { name: 'Last 7 Days' },
      { name: 'Last 14 Days' },
      { name: 'Last 21 Days' },
    ];
    this.selectTimeSlot = this.timeSlot[0];

    this.hrincidentform = this.fb.group({
      owner_id: [''],
      issue_desc: ['', Validators.required],
      call_mode_id: ['', Validators.required],
      status_id: ['', Validators.required],
      call_type_id: ['', Validators.required],
      sla_id: ['', Validators.required],
      service_id: ['', Validators.required],
      support_group_id: ['', Validators.required],
      ci_id: [''],
      log_note: [''],
      prev_note: [''],
      user_assigned_to_id: [''],
    });

    this.slaFormData = this.fb.group({
      sla_time: ['', Validators.required],
    });

    this.getAllDropdownLists();
    this.getMyTickets();
  }

  getAllDropdownLists() {
    this.hrincident.getCallModes().subscribe((data) => {
      // console.log(data);
      this.callmodes = data;
    });
    this.hrincident.getAllStatuses().subscribe((data) => {
      // console.log(data);
      this.allstatus = data;
    });
    this.hrincident.getAllCallTypes().subscribe((data) => {
      // console.log(data);
      this.calltypes = data;
    });
    this.hrincident.getAllSLAs().subscribe((data) => {
      // console.log(data);
      this.allslas = data;
    });
    this.hrincident.getSupportGroups().subscribe((data) => {
      // console.log(data);
      this.supportgroups = data;
    });
    this.hrincident.getAllService().subscribe((data) => {
      // console.log(data);
      this.services = data;
    });
    this.hrincident.getAllUsers().subscribe((data) => {
      // console.log(data);
      this.users = data;
    });
  }

  onServiceChange(event: any) {
    const selectedServiceId = event.value;

    // Call the API to get affected products by the selected service ID
    this.hrincident.getCiById(selectedServiceId).subscribe(
      (data) => {
        // Assuming 'data' contains the affected products list
        this.affectedproducts = data;

        // Check if ci_id already exists in the form (could be null initially)
        const currentCiId = this.hrincidentform.get('ci_id')?.value;

        // If ci_id is null or empty, patch with the first affected product
        if (!currentCiId && this.affectedproducts?.length > 0) {
          const defaultCiId = this.affectedproducts[0]?.ci_id; // Patch with the first product
          this.hrincidentform.patchValue({
            ci_id: defaultCiId,
          });
        }

        // Trigger change detection to update the UI
        this.cdRef.detectChanges();
      },
      (error) => {
        console.error('Error fetching affected products:', error);
      }
    );
  }
  serviceChangebYID(id: any) {

// console.log(id);

    // Call the API to get affected products by the selected service ID
    this.hrincident.getCiById(id).subscribe(
      (data) => {
        // Assuming 'data' contains the affected products list
        this.affectedproducts = data;

        // Check if ci_id already exists in the form (could be null initially)
        const currentCiId = this.hrincidentform.get('ci_id')?.value;
// console.log(currentCiId);

        // If ci_id is null or empty, patch with the first affected product
        if (currentCiId && this.affectedproducts?.length > 0) {
          const defaultCiId = this.affectedproducts[0]?.ci_id; // Patch with the first product
          this.hrincidentform.patchValue({
            ci_id: defaultCiId,
          });
        }

        // Trigger change detection to update the UI
        this.cdRef.detectChanges();
      },
      (error) => {
        console.error('Error fetching affected products:', error);
      }
    );
  }

  // Method to handle tab change
  onTabChange(index: number) {
    this.activeTabIndex = index;
    switch (index) {
      case 0: // My Tickets Tab
        this.selectedTab = 'myTickets';
        this.getMyTickets(); // Fetch user's tickets
        break;
      case 1: // Open Tickets Tab
        this.selectedTab = 'groupTickets';
        this.getGroupedTickets(); // Fetch open tickets
        break;
      case 2: // In Progress Tickets Tab
        this.selectedTab = 'assignedtoTickets';
        this.getAssignedToTickets(); // Fetch in-progress tickets
        break;
      case 3: // Closed Tickets Tab
        this.selectedTab = 'onholdTickets';
        this.fetchTicketsByStatus('on-hold'); // Fetch closed tickets
        break;
      case 4:
        this.selectedTab = 'closedTickets';
        this.fetchTicketsByStatus('closed'); // Fetch open tickets
        break;
      default:
        break;
    }
  }

  clear(table: any) {
    table.clear();
  }

  openDialogue() {
    this.editUserId = null;
    this.hrincidentform.reset(); // Clear the form
    // Assuming 'Open' has an ID of 1 in your statusList
    const openStatus = this.allstatus.find(
      (status: { status_name: string }) => status.status_name === 'Open'
    );
    const callMode = this.callmodes.find(
      (callmode: { mode: string }) => callmode.mode === 'web'
    );
    const callModePhone = this.callmodes.find(
      (callmode: { mode: string }) => callmode.mode === 'phone'
    );

    // Patch the form with the 'Open' status ID and disable the dropdown
    this.hrincidentform.patchValue({
      status_id: openStatus?.id || null, // Use the ID for 'Open' or null if not found
      call_mode_id: window.innerWidth <= 768 ? callModePhone?.id : callMode?.id,
    });

    this.isCallModeReadOnly = true;

    this.hrRequestDialouge = true;
  }
  onSubmit() {
    if (this.hrincidentform.valid) {
      const formValue = this.hrincidentform.value;
      const assetData = {
        owner_id: this.userid,
        issue_desc: formValue.issue_desc,
        call_mode_id: formValue.call_mode_id,
        status_id: formValue.status_id,
        call_type_id: formValue.call_type_id,
        sla_id: formValue.sla_id,
        service_id: +formValue.service_id,
        support_group_id: formValue.support_group_id,
        ci_id: formValue.ci_id,
      };

      this.hrincident.createIncident(assetData).subscribe({
        next: (response: any) => {
          this.hrRequestDialouge = false;
          this.toaster.showSuccess('HR incident created successfully!');
          this.getMyTickets();
          // Optionally, refresh the data or perform other actions
        },
        error: (error: any) => {
          this.toaster.showError('Failed to create incident.');
        },
      });
    } else {
      this.toaster.showError('Please fill all required fields.');
    }
  }

  getMyTickets() {
    // console.log('get all HR incidents');

    this.hrincident.getMyTickets(this.userid).subscribe({
      next: (res: any) => {
        // console.log('API Response:', res); // Inspect the response structure

        // Access the 'data' property of the response
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          this.myTickets = res.data; // Use res.data, not res
          // this.toaster.showSuccess('My Tickets Loaded Successfully');
          // console.log('HR Incidents:', this.hrincidents);
        } else {
          this.myTickets = [];
          console.error('Unexpected response format:', res);
        }
      },
      error: (err: any) => {
        console.error('Error fetching data:', err);
      },
    });
  }

  getGroupedTickets() {
    // console.log('get all HR incidents');

    this.hrincident.getbySupportGrp(this.userid).subscribe({
      next: (res: any) => {
        // console.log('API Response:', res); // Inspect the response structure

        // Access the 'data' property of the response
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          this.groupedTickets = res.data; // Use res.data, not res
          // console.log('HR Incidents:', this.hrincidents);
        } else {
          this.groupedTickets = [];
          console.error('Unexpected response format:', res);
        }
      },
      error: (err: any) => {
        console.error('Error fetching data:', err);
      },
    });
  }

  getAssignedToTickets() {
    // console.log('get all HR incidents');

    this.hrincident.getbyAssignedToTickets(this.userid).subscribe({
      next: (res: any) => {
        // console.log('API Response:', res); // Inspect the response structure

        // Access the 'data' property of the response
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          this.assignedTo = res.data; // Use res.data, not res
          // console.log('HR Incidents:', this.hrincidents);
        } else {
          this.assignedTo = [];
          console.error('Unexpected response format:', res);
        }
      },
      error: (err: any) => {
        console.error('Error fetching data:', err);
      },
    });
  }

  // Method to fetch tickets by status
  fetchTicketsByStatus(status: string) {
    // console.log('Fetching Tickets by Status:', status);
    this.hrincident.getTicketsByStatus(status).subscribe({
      next: (res: any) => {
        // console.log('API Response:', res);
        if (
          res &&
          Array.isArray(res.data) &&
          res.message !== 'No on hold HR requests found'
        ) {
          if (status == 'on-hold') {
            this.onHold = res.data;
          } else if (status == 'closed') {
            this.closedTickets = res.data;
          }
        } else {
          if (status == 'on-hold') {
            this.onHold = [];
            this.toaster.showInfo(res.message);
          } else if (status == 'closed') {
            this.closedTickets = [];
            this.toaster.showInfo(res.message);
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching tickets:', err);
        this.toaster.showError('No data found.');
      },
    });
  }

  openEditDialogue(incidentId: any) {
    this.editUserId = incidentId?.hr_id;

    // Fetch the incident details by ID
    this.hrincident.getIncidentById(this.editUserId).subscribe({
      next: (rowData: any) => {
        const responseData = rowData.data.hrRequest;
        const logNotes = rowData.data.logNotes;
// console.log(responseData);

        // Format log notes in the specific format
        const formattedLogNotes = logNotes
          .map(
            (note: any) =>
              `Created By: ${note.user_name}, Created On: ${new Date(
                note.created_at
              ).toLocaleString()} - ${note.log_note}`
          )
          .join('\n');
          this.serviceChangebYID(responseData?.service_id)
        // Patch the form with the values from the API response
        this.hrincidentform.patchValue({
          issue_desc: responseData?.issue_desc,
          call_mode_id: responseData?.call_mode_id,
          status_id: responseData?.status_id,
          call_type_id: responseData?.call_type_id,
          sla_id: responseData?.sla_id,
          service_id: responseData?.service_id,
          support_group_id: responseData?.support_group_id,
          prev_note: formattedLogNotes,
          user_assigned_to_id: responseData?.user_assigned_to_id,
        });

        // Only patch ci_id if it exists
        if (responseData.ci_id) {
          this.hrincidentform.patchValue({
            ci_id: responseData.ci_id,
          });
          this.onServiceChange({ value: responseData.service_id });
        } else {
          // Fetch affected products based on service_id
          this.onServiceChange({ value: responseData.service_id });
        }

        this.hrRequestDialouge = true; // Open the dialog
      },
      error: (err: any) => {
        this.toaster.showError('Error fetching asset details');
      },
    });
  }

  onUpdate() {
    const formValue = this.hrincidentform.value;
    // Prepare the asset data object
    const assetData = {
      issue_desc: formValue.issue_desc,
      call_mode_id: formValue.call_mode_id,
      status_id: formValue.status_id,
      call_type_id: formValue.call_type_id,
      sla_id: formValue.sla_id,
      service_id: formValue.service_id,
      support_group_id: formValue.support_group_id,
      ci_id: formValue.ci_id,
      log_note: formValue.log_note,
      user_assigned_to_id: formValue.user_assigned_to_id,
    };

    // Call the service to update the asset
    this.hrincident.updateIncident(this.editUserId, assetData).subscribe({
      next: (res: any) => {
        this.onTabChange(this.activeTabIndex);
        this.hrRequestDialouge = false;
        this.toaster.showSuccess('Incident Updated Successfully!');
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
        this.hrRequestDialouge = false;
      },
    });
  }

  slaDialouge() {
    this.slaFormData.reset();
    this.slaDialog = true;
  }
  addSla() {
    this.managementService
      .addOptions('api/addsla', this.slaFormData.value)
      .subscribe({
        next: (res: any) => {
          this.getAllDropdownLists();
          this.slaDialog = false;
          this.toaster.showSuccess('Added Successfully!');
        },
        error: (err: any) => {
          this.toaster.showWarn(err.error?.error);
        },
      });
  }
}
