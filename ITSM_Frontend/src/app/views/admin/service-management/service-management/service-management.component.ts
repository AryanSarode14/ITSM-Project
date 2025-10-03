import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';

@Component({
  selector: 'app-service-management',
  templateUrl: './service-management.component.html',
  styleUrls: ['./service-management.component.scss']
})
export class ServiceManagementComponent {
  customers!: any[];
  serviceFormData!:FormGroup
  serviceDialouge:boolean=false
  editUserId:any
    representatives!: any[];
    timeSlot!: any[];
    statuses!: any[];

    loading: boolean = false;

  
    selectedRepresentative: any; 
      
    ServiceListData: any=[];

    addDeptDialog:boolean=false;
    departmentFormData!:FormGroup
columns = [
  { field: 'service_name', header: 'Service Name' },
  { field: 'department', header: 'Department' },
  
];
departmentList: any[]=[];
constructor(private fb: FormBuilder,private managementService:ManagementService,private toaster:ToasterService) { 
this.getAllServiceList()
}
    ngOnInit() {
   this.getDepartmentList()
      this.serviceFormData = this.fb.group({
        service_name: ['', Validators.required],
        department_id: ['', Validators.required],
        // Add other form controls as needed
      });
      this.departmentFormData= this.fb.group({
        department_name:['', Validators.required],
      })

       
    }
    openEditDialogue(rowData: any) {
      this.editUserId = rowData?.service_id;
  // console.log(rowData);

 
  // console.log( this.editUserId,rowData );

  this.managementService.getDropdownListData(`api/getservicebyid/${this.editUserId}`).subscribe({
    next: (res: any) => {
      // console.log("edit id",res);
      
      // Patch the retrieved data into the form
      this.serviceFormData.patchValue({

        service_name: res?.service_name || '', // patch issue_description
        department_id: res?.dept_id || '',                      // patch sla_id
        
 

    });

    },
    error:(err:any)=>{
      this.toaster.showError(err.error.error)
    }
})
    
      this.serviceDialouge = true;
     
      
    }

    getAllServiceList(){
      this.managementService.getAllData('api/getservicebydept').subscribe({
        next:(res:any)=>{
          this.ServiceListData=res
          // this.toaster.showSuccess("Record Loaded Successfully")
          // console.log("res",res);
  
        },
        error:(err:any)=>{
          this.toaster.showError(err.error.error)
        }
    })
    }
    getDepartmentList(){
      this.managementService.getDropdownListData('api/getdepartment').subscribe({
        next:(res:any)=>{
          this.departmentList=res
          
        //  console.log(res);
         
  
        },
        error:(err:any)=>{
          this.toaster.showError(err.error.error)
        }
    })
    }

    openDialouge(){
      this.serviceFormData.reset(); // Clear the form
      this.editUserId = null; 
    this.serviceDialouge=true
    }
    // Submit new HR request
    onSubmit() {
      if (this.serviceFormData.valid) {
        const formData = this.serviceFormData.value;
        this.managementService.postAllData('api/createservice',formData).subscribe(
          (response) => {

            this.toaster.showSuccess('Record Successfully Uploaded .')
            this.getAllServiceList()
            this.serviceDialouge = false; // Close the dialog
          },
          (error) => {
            this.toaster.showWarn(error.error.error)
            this.serviceDialouge = false; 
          }
        );
      } else {
      this.toaster.showWarn('Please fill in all required fields')
      }
    }
    onUpdate(){
      this.managementService.editData('api/updateservice',this.editUserId,this.serviceFormData.value).subscribe({
        next:(res:any)=>{
  
          this.getAllServiceList();
          this.serviceDialouge=false
          this.toaster.showSuccess("Record Update Successfully !...")
          
        },
        error:(err:any)=>{
          this.toaster.showError(err.error.error)
          this.serviceDialouge=false
        }
      })

    }

    departmentDialouge(){
      this.departmentFormData.reset()
      this.addDeptDialog=true
    }
    addDepartment(){
      this.managementService.addOptions('api/adddepartment',this.departmentFormData.value).subscribe({
        next: (res: any) => {
          this.getDepartmentList()
          this.addDeptDialog=false
          this.toaster.showSuccess('Added Successfully!')

      },
      error:(err:any)=>{
       this.toaster.showWarn(err.error?.error)
        
      }
      })
    }
}