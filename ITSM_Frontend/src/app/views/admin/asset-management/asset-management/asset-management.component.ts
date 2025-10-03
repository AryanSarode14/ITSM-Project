import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Table } from 'primeng/table'; // Import PrimeNG Table
import { AssetsService } from 'src/app/Services/assets.service';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';
@Component({
  selector: 'app-asset-management',
  templateUrl: './asset-management.component.html',
  styleUrls: ['./asset-management.component.scss'],
})
export class AssetManagementComponent {
  showAssetHistory: boolean = false;
  onSubmit() {
    throw new Error('Method not implemented.');
  }
  @ViewChild('dt2') dt2!: Table; // Access the PrimeNG table
  // customers: any[] = [];
  representatives: any[] = [];
  selectedRepresentative: any;
  timeSlot: any[] = [];
  assetForm!: FormGroup;
  auditData: any = [];
  ownerList: any = [];
  selectedTimeSlot: any;
  CIClassification: any = [];
  assetHistoryDialouge: boolean = false;
  CIcategory: any = [];
  assetCreateDialouge: boolean = false;
  loading: boolean = false;
  dateFormat: string = 'dd/mm/yy';
  assets: any = [];
  assetsHistory: any = [];
  groupedTickets: any;
  showHelpDialog: boolean = false;

  CIDialog: boolean = false;
  CIFormData!: FormGroup;

  categoryDialog: boolean = false;
  categoryFormData!: FormGroup;

  // assetTypesDialog:boolean=false
  // assetTypesFormData!:FormGroup

  branchFormData!: FormGroup;
  branchDialog: boolean = false;

  modelFormData!: FormGroup;
  modelDialog: boolean = false;

  vendorFormData!: FormGroup;
  vendorDialog: boolean = false;
  columns = [
    { field: 'name', header: 'Asset Name' },
    { field: 'serial_no', header: 'Serial No.' },
    { field: 'type_name', header: 'Asset Type' },
    { field: 'purchase_date', header: 'Purchase Date' },
    { field: 'warranty_end', header: 'Expiry Date' },
    { field: 'owner_name', header: 'Assigne To' },
    { field: 'vendor', header: 'Vendor' },
    { field: 'status_name', header: 'Status' },
  ];

  assetTypes: any;
  owners: any;
  cicategory: any;
  services: any;
  supportgroups: any;
  vendors: any;
  branches: any;
  modals: any;
  assetHistoryData: any;
  statusListData: any = [];
  editUserId: any;
  showBulkUploadModal: boolean = false;
  selectedFile: File | null = null; // Variable to store the selected file
  selectedFileName: string | null = null;
  constructor(
    private fb: FormBuilder,
    private managementService: ManagementService,
    private toaster: ToasterService,
    private assetService: AssetsService,
    private http: HttpClient
  ) {}

  assetType: any[] | undefined;

  ngOnInit() {
    this.loading = true;

    this.assetForm = this.fb.group({
      asset_name: [''],
      asset_serial_no: [''],
      invoice_date: ['', Validators.required],
      warranty_start_date: ['', Validators.required],
      warranty_end_date: ['', Validators.required],
      description: ['', Validators.required],
      ci_name: ['', Validators.required],
      asset_owner_id: ['', Validators.required], // Refers to user_id in user_details table
      asset_ci_classification_id: ['', Validators.required], // Refers to ci_classification_id in ci_classification table
      asset_ci_category_id: ['', Validators.required], // Refers to ci_category_id in ci_category table
      asset_service_id: ['', Validators.required],
      asset_type_id: ['', Validators.required],
      asset_support_group_detail_id: ['', Validators.required],
      vendor_id: ['', Validators.required],
      branch_id: [''],
      model_id: [''],
      assetstatus_id: ['', Validators.required],
    });

    this.CIFormData = this.fb.group({
      ci_classification_name: ['', [Validators.required]],
    });

    this.categoryFormData = this.fb.group({
      ci_category_name: ['', [Validators.required]],
    });

    // this.assetTypesFormData=this.fb.group({
    //   asset_type_name: ['', [Validators.required]],
    // })

    this.vendorFormData = this.fb.group({
      vendor_name: ['', [Validators.required]],
    });
    this.branchFormData = this.fb.group({
      branch_name: ['', [Validators.required]],
    });

    this.modelFormData = this.fb.group({
      model_name: ['', [Validators.required]],
    });
    this.loading = false; // Set loading to false after data is loaded
    this.getAllAssets();
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

  downloadTemplate() {
    // Path to the Excel template in your assets folder
    const templatePath = 'assets/templates/AssetBulk.xlsx';

    // Get the Excel file and trigger download
    this.http.get(templatePath, { responseType: 'blob' }).subscribe(
      (blob) => {
        // Create a link element and download the file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'AssetBulk.xlsx'; // File name when downloading
        a.click();
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        console.error('Error downloading the template', error);
      }
    );
  }
  openViewDialogue(event: any) {
    this.assetHistoryDialouge = true;
    this.assetService.getAssetsHistorybyAssetID(event.id).subscribe({
      next: (rowData: any) => {
        if (rowData.success == true) {
          this.assetHistoryData = rowData.history;
        }
      },
      error: (err: any) => {
        this.toaster.showError('Error fetching asset details');
      },
    });
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
      this.assetService.assetbulkUpload('api/bulkupload', formData).subscribe(
        (response) => {
          // console.log('Upload successful', response);
          this.toaster.showSuccess('File uploaded successfully!');

          this.selectedFile = null;
          this.selectedFileName = null;
          this.onCloseBulkUploadModal();
          this.getAllAssets();
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
  toggleAssetHistory() {
    
    if (this.showAssetHistory) {
      // Switch back to normal asset view
      this.getAllAssets();
      this.showAssetHistory = false;
      this.toaster.showSuccess('Assets Loaded Successfully!');
    } else {
      // Switch to asset history view
      this.getAllAssets();
      this.showAssetHistory = true;
      this.toaster.showSuccess('Asset History Loaded Successfully!');
    }
  }

  getAllDropdowns() {
    this.assetService.getAssetType('api/assetstatus').subscribe((data) => {
      // console.log(data);
      this.statusListData = data;
    });
    this.assetService.getAssetType('api/getassettype').subscribe((data) => {
      // console.log(data);
      this.assetTypes = data;
    });
    this.assetService.getOwners('api/getreporting').subscribe((data) => {
      // console.log(data);
      this.owners = data;
    });
    this.assetService
      .getCiCategory('api/getallcicategory')
      .subscribe((data) => {
        // console.log(data);
        this.cicategory = data;
      });
    this.assetService
      .getCiClassifications('api/getallciclassification')
      .subscribe((data) => {
        // console.log(data);
        this.CIClassification = data;
      });
    this.assetService.getServices('api/getallservice').subscribe((data) => {
      // console.log(data);
      this.services = data;
    });
    this.assetService
      .getSupportGroups('api/support_group_details')
      .subscribe((data) => {
        // console.log(data);
        this.supportgroups = data;
      });
    this.assetService.getVendors('api/getallvendors').subscribe((data) => {
      // console.log(data);
      this.vendors = data;
    });
    this.assetService.getAllBranches('api/getallbranches').subscribe((data) => {
      // console.log(data);
      this.branches = data;
    });
    this.assetService.getAllModals('api/getallmodels').subscribe((data) => {
      // console.log(data);
      this.modals = data;
    });
  }

  getAllAssets() {
    // console.log('get all user list');
    this.assetService.getAssets('api/assets').subscribe({
      next: (res: any) => {
        if (res.success == true) {
          this.assets = res.assets;
        }
        // this.toaster.showSuccess("Record Loaded Successfully")
        // console.log('res', res);
      },
      error: (err: any) => {},
    });
  }

  openEditDialogue(assetId: any) {
    this.editUserId = assetId?.id;
    // Call the API to fetch asset details by ID
    this.assetService.getAssetById('api/assets', this.editUserId).subscribe({
      next: (rowData: any) => {
        // Convert the date strings to JavaScript Date objects
        const purchaseDate = rowData?.purchase_date
          ? new Date(rowData?.purchase_date)
          : null;
        const warrantyStartDate = rowData?.assigned_date
          ? new Date(rowData?.assigned_date)
          : null;
        const warrantyEndDate = rowData?.expiry_date
          ? new Date(rowData?.expiry_date)
          : null;

        // Patch the form with the values from the API response
        this.assetForm.patchValue({
          asset_name: rowData?.asset_name,
          asset_serial_no: rowData?.asset_serial_no,
          invoice_date: purchaseDate,
          warranty_start_date: warrantyStartDate,
          warranty_end_date: warrantyEndDate,
          description: rowData?.description,
          ci_name: rowData?.ci_name, // Keep the name for display purposes

          // Patch the IDs directly from the response
          asset_owner_id: rowData?.asset_owner_id || null,
          asset_type_id: rowData?.asset_type_id || null,
          asset_ci_category_id: rowData?.asset_ci_category_id || null,
          asset_ci_classification_id:
            rowData?.asset_ci_classification_id || null,
          asset_service_id: rowData?.asset_service_id || null,
          asset_support_group_detail_id:
            rowData?.asset_support_group_detail_id || null,
          vendor_id: rowData?.vendor_id || null,
          branch_id: rowData?.branch_id || null,
          model_id: rowData?.model_id || null,
        });

        // Open the dialog for editing
        this.assetCreateDialouge = true;
      },
      error: (err: any) => {
        this.toaster.showError('Error fetching asset details');
      },
    });
  }
  //surrender asset
  surrenderAsset(event: any) {
    
    this.assetService.surrenderAssetbyAssetID(event.id).subscribe({
      next: (rowData: any) => {
        if (rowData.success == true) {
          this.toaster.showSuccess(rowData.message);
          this.getAllAssets();
        }
      },
      error: (err: any) => {
        this.toaster.showError('Error fetching asset details');
      },
    });
  }

  //check condition for showing surrender button
  checkCondition(data: any) {
    ;
  }

  //check condition for showing status button
  checkStatusCondition(data1: any) {
    ;
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
    this.assetForm.reset(); // Clear the form
    this.editUserId = null;
    this.assetCreateDialouge = true;
  }

  saveAsset() {
    if (this.assetForm.valid) {
      const formValue = this.assetForm.value;
      const assetData = {
        asset_name: formValue.asset_name,
        asset_serial_no: formValue.asset_serial_no,
        purchase_date: this.convertToLocalDate(formValue.invoice_date),
        assigned_date: this.convertToLocalDate(formValue.warranty_start_date),
        expiry_date: this.convertToLocalDate(formValue.warranty_end_date),
        ci_name: formValue.ci_name,
        asset_owner_id: formValue.asset_owner_id,
        asset_ci_classification_id: formValue.asset_ci_classification_id,
        asset_ci_category_id: formValue.asset_ci_category_id,
        asset_service_id: formValue.asset_service_id,
        asset_support_group_detail_id: formValue.asset_support_group_detail_id,
        description: formValue.description,
        vendor_id: formValue.vendor_id,
        branch_id: formValue.branch_id,
        model_id: formValue.model_id,
        asset_type_id: formValue.asset_type_id,
        assetstatus_id: formValue.assetstatus_id,
        // Add other fields if necessary
      };

      this.assetService.createAsset('api/createasset', assetData).subscribe({
        next: (response: any) => {
          this.toaster.showSuccess('Asset created successfully!');
          this.assetCreateDialouge = false;
          this.getAllAssets();
          // Optionally, refresh the data or perform other actions
        },
        error: (error: any) => {
          this.toaster.showError('Failed to create asset.');
        },
      });
    } else {
      this.toaster.showError('Please fill all required fields.');
    }
  }
  convertToLocalDate(date: string | Date): string | null {
    if (!date) return null;

    // Ensure date is a Date object
    const selectedDate = new Date(date);

    // Correct for timezone issues by getting local time
    const localDateString = selectedDate.toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD format
    return localDateString;
  }

  onUpdate() {
    const formValue = this.assetForm.value;

    // Convert to full ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
    // const purchaseDate = formValue.invoice_date
    //   ? new Date(formValue.invoice_date).toISOString()
    //   : null;

    // const warrantyStartDate = formValue.warranty_start_date
    //   ? new Date(formValue.warranty_start_date).toISOString()
    //   : null;

    // const warrantyEndDate = formValue.warranty_end_date
    //   ? new Date(formValue.warranty_end_date)
    //   : null;
    // console.log('purchaseDate: ', purchaseDate);
    // Prepare the asset data object
    const assetData = {
      asset_name: formValue.asset_name,
      asset_serial_no: formValue.asset_serial_no,
      purchase_date: this.convertToLocalDate(formValue.invoice_date), // Full ISO format
      assigned_date: this.convertToLocalDate(formValue.warranty_start_date), // Full ISO format
      expiry_date: this.convertToLocalDate(formValue.warranty_end_date), // Full ISO format
      ci_name: formValue.ci_name,
      asset_owner_id: formValue.asset_owner_id,
      asset_ci_classification_id: formValue.asset_ci_classification_id,
      asset_ci_category_id: formValue.asset_ci_category_id,
      asset_service_id: formValue.asset_service_id,
      asset_support_group_detail_id: formValue.asset_support_group_detail_id,
      description: formValue.description,
      vendor_id: formValue.vendor_id,
      branch_id: formValue.branch_id,
      model_id: formValue.model_id,
      asset_type_id: formValue.asset_type_id,
      assetstatus_id: formValue.assetstatus_id,
    };

    // Call the service to update the asset
    this.assetService
      .updateAsset('api/updateasset', this.editUserId, assetData)
      .subscribe({
        next: (res: any) => {
          this.getAllAssets();
          this.assetCreateDialouge = false;
          this.toaster.showSuccess('Record Updated Successfully!');
        },
        error: (err: any) => {
          this.toaster.showError(err.error.error);
          this.assetCreateDialouge = false;
        },
      });
  }

  categoryDialouge() {
    this.categoryFormData.reset();
    this.categoryDialog = true;
  }

  addCategory() {
    this.managementService
      .addOptions('api/addcicategory', this.categoryFormData.value)
      .subscribe({
        next: (res: any) => {
          this.getAllDropdowns();
          this.categoryDialog = false;
          this.toaster.showSuccess('Added Successfully!');
        },
        error: (err: any) => {
          this.toaster.showWarn(err.error?.error);
        },
      });
  }

  classificationDialouge() {
    this.CIFormData.reset();
    this.CIDialog = true;
  }

  addCI() {
    this.managementService
      .addOptions('api/addciclassification', this.CIFormData.value)
      .subscribe({
        next: (res: any) => {
          this.getAllDropdowns();
          this.CIDialog = false;
          this.toaster.showSuccess('Added Successfully!');
        },
        error: (err: any) => {
          this.toaster.showWarn(err.error?.error);
        },
      });
  }

  // assetTypesDialouge(){
  //   this.assetTypesFormData.reset();
  //   this.assetTypesDialog=true
  // }

  // addassetTypes(){
  //   this.managementService.addOptions('api/addassettype',this.assetTypesFormData.value).subscribe({
  //     next: (res: any) => {
  //       this.getAllDropdowns();
  //       this.assetTypesDialog=false
  //     },
  //     error:(err:any)=>{
  //      this.toaster.showWarn(err.error?.error)

  //     }
  //   })

  // }

  vendorDialouge() {
    this.vendorFormData.reset();
    this.vendorDialog = true;
  }

  addvendorDialouge() {
    this.managementService
      .addOptions('api/addvendor', this.vendorFormData.value)
      .subscribe({
        next: (res: any) => {
          this.getAllDropdowns();
          this.vendorDialog = false;
          this.toaster.showSuccess('Added Successfully!');
        },
        error: (err: any) => {
          this.toaster.showWarn(err.error?.error);
        },
      });
  }

  branchDialouge() {
    this.branchFormData.reset();
    this.branchDialog = true;
  }

  addBranch() {
    this.managementService
      .addOptions('api/addbranch', this.branchFormData.value)
      .subscribe({
        next: (res: any) => {
          this.getAllDropdowns();
          this.branchDialog = false;
          this.toaster.showSuccess('Added Successfully!');
        },
        error: (err: any) => {
          this.toaster.showWarn(err.error?.error);
        },
      });
  }

  modelDialouge() {
    this.modelFormData.reset();
    this.modelDialog = true;
  }

  addModel() {
    this.managementService
      .addOptions('api/addModel', this.modelFormData.value)
      .subscribe({
        next: (res: any) => {
          this.getAllDropdowns();
          this.modelDialog = false;
          this.toaster.showSuccess('Added Successfully!');
        },
        error: (err: any) => {
          this.toaster.showWarn(err.error?.error);
        },
      });
  }
}
