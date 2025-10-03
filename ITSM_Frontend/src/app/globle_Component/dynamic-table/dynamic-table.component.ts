import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PrimengModule } from 'src/app/primeng/primeng.module';
import { ManagementService } from 'src/app/Services/management.service';
import { ToasterService } from 'src/app/Services/toaster.service';
import * as XLSX from 'xlsx';
import { Subject, debounceTime } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { ConfirmationService, MessageService } from 'primeng/api';
@Component({
  selector: 'app-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
  standalone: true,
  imports: [PrimengModule]
})
export class DynamicTableComponent {
  @Input() data: any[] = [];
  @Input() columns: any[] = [];
  @Input() showEditButton: boolean = true;
  @Input() showViewButton: boolean = false;
  @Output() editClicked = new EventEmitter<number>();
  @Output() viewClicked = new EventEmitter<number>();


  filteredData: any[] = [];
  status:any;
  selectedColumns: any[] = [];  // Changed from single selectedColumn to an array
  displayedColumns: any[] = [];
  columnOptions: any[] = []; // New array for multi-select options
  private searchSubject: Subject<string> = new Subject<string>();

  constructor(private managementService: ManagementService,private confirmationService: ConfirmationService, private toaster: ToasterService,private clipboard: Clipboard, private messageService: MessageService) {
   
    this.filteredData = [...this.data];
    
    // Subscribe to search input changes
    this.searchSubject.pipe(debounceTime(300)).subscribe(query => this.applySearch(query));
  }

  ngOnChanges() {
    
    this.filteredData = this.data;

    // Initialize column options including the "All" option
    this.columnOptions = [ ...this.columns];
    
    // Set default to display all columns
    this.selectedColumns = this.columns;
    this.displayedColumns = [...this.columns]; // Display all by default
  }

  onEditClick(id: number) {
    this.editClicked.emit(id);
  }

  
  // onSurrenderClick(id: number) {
  //   this.surrenderClicked.emit(id);
  // }

  downloadExcel() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'data.xlsx');
  }

  onColumnSelect() {
    // Check if "All" is selected
    const allSelected = this.selectedColumns.some(col => col.field === 'all');
  
    if (allSelected) {
      // If "All" is selected, set selectedColumns to all columns
      this.selectedColumns = [...this.columnOptions]; // Select all columns
      this.displayedColumns = [...this.columns]; // Display all columns
    } else {
      // If "All" is not selected, filter out "All" from the selectedColumns
      this.selectedColumns = this.selectedColumns.filter(col => col.field !== 'all');
  
      // If "All" is not selected, uncheck all options
      this.displayedColumns = this.selectedColumns; // Update displayedColumns based on the remaining selections
    }
  
    // Check if selectedColumns is empty, and if so, clear displayedColumns
    if (this.selectedColumns.length === 0) {
      this.displayedColumns = [];
    }
  }
  copyText(text: string,event:Event) {
    this.clipboard.copy(text);

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Text Copied ... ',
      // icon: 'pi pi-info-circle',  // Optionally, display an info icon
      acceptVisible: false,       // Hide the accept (Yes) button
      rejectVisible: false,       // Hide the reject (No) button
      
      // Optionally, you can add a custom styling class
      // Class: 'custom-confirm-popup',
    });
    setTimeout(() => {
      this.confirmationService.close();  // Close the confirmation popup
    }, 1000);
  }
  

  onAccessChange(row: any, event: any) {
    const hasAccess = event.checked;
    const userId = row.user_id;

    const payload = { userId: userId, has_access: hasAccess };

    this.managementService.updateHas_Access('api/access', payload).subscribe({
      next: (res: any) => {
        this.toaster.showSuccess('Update Successfully');
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      }
    });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value.trim().toLowerCase());
  }

  applySearch(query: string) {
    if (!query) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter(row => 
        this.columns.some(col => 
          row[col.field] !== null && row[col.field] !== undefined &&
          row[col.field].toString().toLowerCase().includes(query)
        )
      );
    }
  }

  onViewClick(id: any) {
    this.viewClicked.emit(id);
  }
}
