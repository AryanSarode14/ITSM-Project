import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';

@Component({
  selector: 'app-ci-management',
  templateUrl: './ci-management.component.html',
  styleUrls: ['./ci-management.component.scss'],
})
export class CiManagementComponent {
  customers!: any[];
  ciFormData!: FormGroup;
  ciManagementDialouge: boolean = false;
  editUserId: any;

  ownerList: any = [{ name: 'Owner 1' }, { name: 'Owner 2' }];
  ServiceNameList: any = [];
  classificationList: any = [];
  categoryList: any = [];

  selectedRepresentative: any;
  ciManagementData: any = [];
  showBulkUploadModal: boolean = false;
  selectedFile: File | null = null; // Variable to store the selected file
  selectedFileName: string | null = null;
  showHelpDialog: boolean = false;
  columns = [
    { field: 'ci_name', header: 'CI Name' },
    { field: 'ci_category_name', header: 'CI Category' },
    { field: 'ci_classification_name', header: 'CI Classification' },
    { field: 'ci_owner_name', header: 'Assigned To' },
  ];
 
  CIDialog:boolean=false
  CIFormData!:FormGroup

  categoryDialog:boolean=false
  categoryFormData!:FormGroup



  constructor(
    private fb: FormBuilder,
    private managementService: ManagementService,
    private toaster: ToasterService,
    private http: HttpClient
  ) {
    this.getAllCIDataList();
  }
  ngOnInit() {
    this.getOwnerNameList();
    this.getServiceNameList();
    this.getClassificationList();
    this.getCategoryList();

    
    this.ciFormData = this.fb.group({
      user_id: ['', Validators.required],
      ci_service_id: ['', Validators.required],
      ci_name: ['', Validators.required],
      ci_description: ['', Validators.required],
      ci_classification_id: ['', [Validators.required]],
      ci_category_id: [''],
    });


    this.CIFormData=this.fb.group({
      ci_classification_name: ['', [Validators.required]],
    })

    this.categoryFormData=this.fb.group({
      ci_category_name: ['', [Validators.required]],
    })

    this.ciManagementData=[];
  }

  getAllCIDataList() {
    // console.log("get all Ci list");

    this.managementService.getDropdownListData('api/getcidata').subscribe({
      next: (res: any) => {
        this.ciManagementData = res;
        // this.toaster.showSuccess("Record Loaded Successfully")
        // console.log("res",res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  getOwnerNameList() {
    this.managementService.getDropdownListData('api/getreporting').subscribe({
      next: (res: any) => {
        this.ownerList = res;
        // console.log(res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  getServiceNameList() {
    this.managementService.getDropdownListData('api/getallservice').subscribe({
      next: (res: any) => {
        this.ServiceNameList = res;
        // console.log("getservice",res);
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  getClassificationList() {
    this.managementService
      .getDropdownListData('api/getallciclassification')
      .subscribe({
        next: (res: any) => {
          this.classificationList = res;
          // console.log(res);
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
        },
      });

  
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
    const templatePath = 'assets/templates/CiBulk.xlsx';

    // Get the Excel file and trigger download
    this.http.get(templatePath, { responseType: 'blob' }).subscribe(
      (blob) => {
        // Create a link element and download the file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CiBulk.xlsx'; // File name when downloading
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
      this.managementService.cibulkUpload('api/cibulkupload', formData).subscribe(
        (response) => {
          // console.log('Upload successful', response);
          this.toaster.showSuccess('File uploaded successfully!');

          this.selectedFile = null;
          this.selectedFileName = null;
          this.onCloseBulkUploadModal();
          this.getAllCIDataList();
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
    this.selectedFile = null;
    this.selectedFileName = null;
  }

  getCategoryList() {
    this.managementService
      .getDropdownListData('api/getallcicategory')
      .subscribe({
        next: (res: any) => {
          this.categoryList = res;
          // console.log(res);
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
        },
      });
  }
  clear(table: any) {
    table.clear();
  }

  openDialouge() {
    this.ciFormData.reset(); // Clear the form
    this.editUserId = null;
    this.ciManagementDialouge = true;
  }
  openEditDialogue(rowData: any) {
    this.editUserId = rowData?.ci_id;
    const editCiId = rowData?.ci_id;
    // console.log( this.editUserId,rowData );

    this.managementService
      .getDropdownListData(`api/getcidatabyid/${editCiId}`)
      .subscribe({
        next: (res: any) => {
          // console.log("edit id",res);

          // Patch the retrieved data into the form
          this.ciFormData.patchValue({
            user_id: res?.user_id ? res.user_id : '',
            ci_service_id: res?.service_id || '',
            ci_name: res?.ci_name || '',
            ci_description: res?.description || '',
            ci_classification_id: res?.ci_classification_id || '',
            ci_category_id: res?.ci_category_id || '',
          });
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
        },
      });

    this.ciManagementDialouge = true;
  }

  onSubmit() {
    if (this.ciFormData.valid) {
      // Handle form submission
      this.managementService
        .postAllData('api/addci', this.ciFormData.value)
        .subscribe({
          next: (res: any) => {
            this.getAllCIDataList();
            this.ciManagementDialouge = false;
            this.toaster.showSuccess('User Created Successfully !...');
          },
          error: (err: any) => {
            this.toaster.showError(err.error.error);
            this.ciManagementDialouge = false;
          },
        });
      // console.log(this.ciFormData.value);
    }
  }
  onUpdate() {
    this.managementService
      .editData('api/updateci', this.editUserId, this.ciFormData.value)
      .subscribe({
        next: (res: any) => {
          this.getAllCIDataList();
          this.ciManagementDialouge = false;
          this.toaster.showSuccess('Record Update Successfully !...');
        },
        error:(err:any)=>{
          this.toaster.showError(err.error.error)
          this.ciManagementDialouge=false
        }
      })

    }
    classificationDialouge(){
      this.CIFormData.reset();
      this.CIDialog=true
    }

    addCI(){
      this.managementService.addOptions('api/addciclassification',this.CIFormData.value).subscribe({
        next: (res: any) => {
          this.getClassificationList();
          this.CIDialog=false
          this.toaster.showSuccess('Added Successfully!')

        },
        error:(err:any)=>{
         this.toaster.showWarn(err.error?.error)
          
        }
      })

    }

    categoryDialouge(){
      this.categoryFormData.reset();
      this.categoryDialog=true
    }

    addCategory(){
      this.managementService.addOptions('api/addcicategory',this.categoryFormData.value).subscribe({
        next: (res: any) => {
          this.getCategoryList();
          this.categoryDialog=false
          this.toaster.showSuccess('Added Successfully!')

        },
        error:(err:any)=>{
         this.toaster.showWarn(err.error?.error)
          
        }
      })

    }
}
