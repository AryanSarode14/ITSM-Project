import { DatePipe, JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as FileSaver from 'file-saver';
import { Table } from 'primeng/table'; // Import PrimeNG Table
import { AssetsService } from 'src/app/Services/assets.service';

import { HrmanagementService } from 'src/app/Services/hrmanagement.service';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';

@Component({
  selector: 'app-problem-management',
  templateUrl: './problem-management.component.html',
  styleUrls: ['./problem-management.component.scss'],
  providers: [DatePipe],
})
export class ProblemManagementComponent {
  showproblemHistory: boolean = false;
  onSubmit() {
    throw new Error('Method not implemented.');
  }
  @ViewChild('dt2') dt2!: Table; // Access the PrimeNG table
  timeSlot: any[] = [];
  problemForm!: FormGroup;
  prev_notesData: any = [];
  ownerList: any = [];
  selectedTimeSlot: any;
  problemCreateDialouge: boolean = false;
  loading: boolean = false;
  dateFormat: string = 'dd/mm/yy';
  showHelpDialog: boolean = false;

  columns = [
    { field: 'description', header: 'Problem Name' },
    { field: 'root_cause', header: 'Root Cause.' },
    { field: 'issue_description', header: 'Related Incident' },
    { field: 'configuration_item_name', header: 'Affected Product' },
    { field: 'category_name', header: 'Category' },
    { field: 'service_name', header: 'Service' },
    { field: 'sla_time', header: 'SLA' },
    { field: 'priority_name', header: 'Priority' },
    { field: 'state_name', header: 'State' },
    { field: 'work_around', header: 'Work Around' },
  ];

  owners: any = [];

  services: any = [];
  supportgroups: any = [];
  attachments: any = [];
  editProblemId: any;
  showBulkUploadModal: boolean = false;
  selectedFile: any = []; // Variable to store the selected file
  selectedFileName: string | null = null;
  categoryList: any = [];
  incidentData: any = [];
  listOfFiles: any = [];
  defaultCreatedBy = null;
  ciListData: any = [];
  stateListData: any = [];
  allslas: any = [];
  priorityList: any = [];
  assignedToList: any = [];
  impactListData: any = [];
  problemListData: any = [];
  notes: any;
  problemDetailsDialog: boolean = false;
  problemDetails: any;

  constructor(
    private fb: FormBuilder,
    private toaster: ToasterService,
    private problemService: AssetsService,
    private incidentService: HrmanagementService,
    private managementService: ManagementService,
    private http: HttpClient,
    private datePipe: DatePipe
  ) {
    this.loading = true;
    const storedUserData = localStorage.getItem('userData');

    // Check if userData exists
    if (storedUserData) {
      // Parse the JSON string back into an object
      var userData = JSON.parse(storedUserData);
      this.defaultCreatedBy = userData.user_id;

      // userData={
      //   full_name:userData.firstName+" "+userData.lastName
      // }
      
    }
    this.problemForm = this.fb.group({
      description: ['', Validators.required],
      category_id: ['', Validators.required],
      sla_id: ['', Validators.required],
      impact_id: ['', Validators.required],
      priority_id: ['', Validators.required],
      support_group_id: ['', Validators.required],
      service_id: ['', Validators.required],
      assigned_to_id: [''],
      state_id: ['', Validators.required],
      configuration_item_id: ['', Validators.required],
      created_by: [this.defaultCreatedBy, Validators.required],
      related_incident: ['', Validators.required],
      root_cause: [''],
      work_around: [''],
      log_note: [''],
      prev_notes: [],
    });
    this.loading = false; // Set loading to false after data is loaded
  }

  problemType: any[] | undefined;

  ngOnInit() {
    this.getAllProblemList();
    this.getAllDropdowns();
  }

  // Method to show help dialog
  showHelpDialogModal() {
    this.showHelpDialog = true;
  }

  // Method to hide help dialog
  onCloseHelpDialog() {
    this.showHelpDialog = false;
  }
  openProblemReqDetails(event: any) {
    ;
    this.problemDetailsDialog = true;
   this.problemDetails=event;
  }
  getAllProblemList() {
    // console.log('get all user list');

    this.managementService.getAllProblemListData().subscribe({
      next: (res: any) => {
        this.problemListData = res.data;
        this.toaster.showSuccess(res.message);
        // console.log('res', res);
      },
      error: (err: any) => {},
    });
  }
  getStatusClass(statusName: string): string {
    console.log(statusName.toLowerCase());

    switch (statusName.toLowerCase()) {
      case 'open':
        return 'status-open';
      case 'close':
        return 'status-closed';
      case 'on hold':
        return 'status-on-hold';
      case 'in progress':
        return 'status-in-progress';
      default:
        return '';
    }
  }

  onFileSelect(event: any) {
    this.selectedFileName = '';
    this.listOfFiles = [];
    this.selectedFile = event.target.files;
    if (this.selectedFile) {
      for (var i = 0; i <= event.target.files.length - 1; i++) {
        var selectedFile = event.target.files[i];
        this.listOfFiles.push(selectedFile.name);
      }
    } else {
      this.selectedFileName = null; // Clear the name if no file is selected
    }
  }

  getAllDropdowns() {
    this.problemService.getOwners('api/getreporting').subscribe((data: any) => {
      // console.log(data);
      this.owners = data;
      this.assignedToList = data;
    });
    this.problemService.getCiCategory('api/categories').subscribe((data) => {
      // console.log(data);
      this.categoryList = data.data;
    });

    this.problemService.getServices('api/getallservice').subscribe((data) => {
      // console.log(data);
      this.services = data;
    });

    this.problemService
      .getSupportGroups('api/support_group_details')
      .subscribe((data) => {
        // console.log(data);
        this.supportgroups = data;
      });
    this.incidentService.getAllImpacts().subscribe((data) => {
      // console.log(data);
      this.impactListData = data;
    });
    this.incidentService.getAllIncidents().subscribe((data) => {
      // console.log(data);
      this.incidentData = data.data;
    });
    this.incidentService.getAllSLAs().subscribe((data) => {
      // console.log(data);
      this.allslas = data;
    });
    this.problemService.getproblems('api/cis').subscribe((data: any) => {
      // console.log(data);
      this.ciListData = data.data;
    });
    this.managementService.getDropdownListData('api/priorities').subscribe({
      next: (res: any) => {
        this.priorityList = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
    this.managementService.getDropdownListData('api/states').subscribe({
      next: (res: any) => {
        this.stateListData = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  downloadPdf(pdfUrl: string, pdfName: string) {
    FileSaver.saveAs(pdfUrl, pdfName);
  }

  openDoc(pdfUrl: string) {
    window.open(pdfUrl + '#page=', '_blank', ''); //true value removed form here if any issue add and check
  }
  delete(id: number, index: any) {
    this.managementService.deleteProblem(id).subscribe({
      next: (res: any) => {
        this.toaster.showSuccess(res.message);
        this.attachments.splice(index, 1);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  removeSelectedFile(index: any) {
    // Delete the item from fileNames list
    this.listOfFiles.splice(index, 1);
    this.selectedFile.splice(index, 1);
  }
  openEditDialogue(problemId: any) {
    this.editProblemId = problemId?.problem_id;
    this.prev_notesData = [];
    const assigned_to_id = this.problemForm.get('assigned_to_id');
    const root_cause = this.problemForm.get('root_cause');
    if (this.editProblemId) {
      assigned_to_id?.setValidators([Validators.required]);
      root_cause?.setValidators([Validators.required]);
    } else {
      assigned_to_id?.clearValidators();
      root_cause?.clearValidators();
    }
    // Call the API to fetch problem details by ID
    this.managementService.getProblemDetailsById(this.editProblemId).subscribe({
      next: (res: any) => {
        const rowData = res.data;
        this.problemCreateDialouge = true;

        // Patch the form with the values from the API response
        this.problemForm.patchValue({
          description: rowData?.description,
          category_id: rowData?.category_id,
          sla_id: rowData?.sla_id,
          impact_id: rowData?.impact_id,
          priority_id: rowData?.priority_id,
          support_group_id: rowData?.support_group_id,
          service_id: rowData?.service_id,
          assigned_to_id: rowData?.assigned_to_id,
          state_id: rowData?.state_id,
          configuration_item_id: rowData?.configuration_item_id,
          created_by: rowData?.created_by != null ? rowData?.created_by : '',
          related_incident: rowData?.related_incident,
          root_cause: rowData?.root_cause != null ? rowData?.root_cause : '',
          work_around: rowData?.work_around != null ? rowData?.work_around : '',
        });
        if (rowData.attachments.length > 0) {
          this.attachments = rowData.attachments;
        }
        if (rowData.log_notes.length != 0) {
          //this.dynamicForm.patchValue(this.incidentLogNotesData[0].table51_id);
          rowData.log_notes.forEach((element: any) => {
            this.prev_notesData.push(
              'Assigned To :' +
                ' ' +
                element.user_name +
                ' ' +
                'Created On :' +
                this.datePipe.transform(element.created_at, 'dd/MM/yy') +
                ' ' +
                '-' +
                ' ' +
                element.note +
                '\n'
            );
          });
          this.notes = this.prev_notesData.toString();
          var total = this.notes.replace(/,/g, '');
          this.problemForm.patchValue({
            prev_notes: total,
            log_note: '',
          });
        } else {
          this.attachments = [];
        }
        // Open the dialog for editing
      },
      error: (err: any) => {
        this.toaster.showError('Error fetching problem details');
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

  // Function to handle the "Add" button click
  openDialogue() {
    this.problemForm.reset(); // Clear the form
    this.editProblemId = null;
    this.problemCreateDialouge = true;
  }

  // create problem
  saveProblem() {
    if (this.problemForm.valid) {
      const formData = new FormData();

      for (let i = 0; i < this.selectedFile.length; i++) {
        formData.append('attachment', this.selectedFile[i]);
      }
      // Append form values
      Object.keys(this.problemForm.value).forEach((key) => {
        if(this.problemForm.value[key]){
          formData.append(key, this.problemForm.value[key]);
        }
      });

      this.managementService.createProblem(formData).subscribe({
        next: (res: any) => {
          this.problemCreateDialouge = false;
          this.toaster.showSuccess(res.message);
          this.getAllProblemList();
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
          this.problemCreateDialouge = false;
        },
      });
    } else {
      this.toaster.showError('Please fill all required fields.');
    }
  }

  onUpdate() {
    const formValue = this.problemForm.value;
    const formData = new FormData();
    for (let i = 0; i < this.selectedFile.length; i++) {
      formData.append('attachment', this.selectedFile[i]);
    }
    // Append form values
    Object.keys(this.problemForm.value).forEach((key) => {
      formData.append(key, this.problemForm.value[key]);
    });

    this.managementService
      .updateProblem(formData, this.editProblemId)
      .subscribe({
        next: (res: any) => {
          this.problemCreateDialouge = false;
          this.toaster.showSuccess(res.message);
          this.getAllProblemList();
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
          this.problemCreateDialouge = false;
        },
      });
  }
}
