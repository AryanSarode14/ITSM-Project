import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';
import { ManagementService } from 'src/app/Services/management.service';

@Component({
  selector: 'app-organization-chart',
  templateUrl: './organization-chart.component.html',
  styleUrls: ['./organization-chart.component.scss'],
  animations: [
    trigger('cardAnimation', [
      state('inactive', style({
        transform: 'scale(1)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
      })),
      state('active', style({
        transform: 'scale(1.05)',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)'
      })),
      transition('inactive <=> active', [
        animate('0.3s')
      ]),
    ]),
    trigger('dialogAnimation', [
      state('void', style({
        transform: 'scale(0.9)',
        opacity: 0
      })),
      state('*', style({
        transform: 'scale(1)',
        opacity: 1
      })),
      transition('void <=> *', [
        animate('0.3s ease-out')
      ])
    ])
  ]
})
export class OrganizationChartComponent {
  activeCardId: number | null = null; // Track the ID of the active card
  displayDialog: boolean = false; // Control dialog visibility
  selectedCardData: any = null; // Store data of the selected card
data:any
  // data: any[] = [
  //   {
  //     label: 'CEO',
  //     type: 'person',
  //     styleClass: 'p-person',
  //     expanded: true,
  //     data: { name: 'John Doe', title: 'CEO' },
  //     children: [
  //       {
  //         label: 'CFO',
  //         type: 'person',
  //         styleClass: 'p-person',
  //         expanded: true,
  //         data: { name: 'Jane Smith', title: 'CFO' },
  //         children: [
  //           {
  //             label: 'Financial Manager',
  //             type: 'person',
  //             styleClass: 'p-person',
  //             data: { name: 'Robert Brown', title: 'Financial Manager' },
  //           },
  //         ],
  //       },
  //       {
  //         label: 'CTO',
  //         type: 'person',
  //         styleClass: 'p-person',
  //         expanded: true,
  //         data: { name: 'Michael White', title: 'CTO' },
  //         children: [
  //           {
  //             label: 'Development Manager',
  //             type: 'person',
  //             styleClass: 'p-person',
  //             data: { name: 'Jessica Green', title: 'Development Manager' },
  //           },
  //         ],
  //       },
  //       {
  //         label: 'CTO',
  //         type: 'person',
  //         styleClass: 'p-person',
  //         expanded: true,
  //         data: { name: 'Michael White', title: 'CTO' },
  //         children: [
  //           {
  //             label: 'Development Manager',
  //             type: 'person',
  //             styleClass: 'p-person',
  //             data: { name: 'Jessica Green', title: 'Development Manager' },
  //           },
  //           {
  //             label: 'Development Manager',
  //             type: 'person',
  //             styleClass: 'p-person',
  //             data: { name: 'Jessica Green', title: 'Development Manager' },
  //           }
  //         ],
  //       }
  //     ],
  //   },
  // ];

constructor(private managementService:ManagementService){
  this.getOrganizationList()
}
getCardBackgroundColor(title: string): string {
  switch (title) {
    case 'Administrator':
      return 'linear-gradient(135deg, #1F618D, #6DD5FA, #2980B9)'; // Dark Blue to Sky Blue
    case 'Developer':
      return 'linear-gradient(135deg, #117A65, #38EF7D, #1ABC9C)'; // Teal Green to Vibrant Green
    case 'Team Lead':
      return 'linear-gradient(135deg, #AF601A, #FFD194, #D68910)'; // Golden Brown to Warm Yellow
    case 'Financial Manager':
      return 'linear-gradient(135deg, #6C3483, #C850C0, #8E44AD)'; // Royal Purple to Magenta
    case 'Development Manager':
      return 'linear-gradient(135deg, #2E86C1, #74ebd5, #5DADE2)'; // Sky Blue to Aqua Blue
    default:
      return 'linear-gradient(135deg, #566573, #A7BFE8, #85929E)'; // Slate Gray to Cool Silver
  }
}

  
  toggleCardState(id: number) {
    this.activeCardId = this.activeCardId === id ? null : id; // Toggle the active state
  }
  openDialog(node: any) {
    // console.log("node",node);
    
    this.selectedCardData = node.data; // Store the data of the clicked card
    this.displayDialog = true; // Show the dialog
  }
  closeDialog() {
    this.displayDialog = false; // Close the dialog
  }

  getOrganizationList() {
    this.managementService.getAllData('api/organizationalchart').subscribe({
      next: (res: any) => {
        // console.log(res); // Check the response structure
  
        // Ensure the response is structured as expected
        if (Array.isArray(res) && res.length > 0) {
          const transformedData = res.map((node: any) => ({
            label: node.user_name, // Use user_name as label
            type: 'person',
            styleClass: 'p-person',
            expanded: true, // Set expanded to true if you want to show the children by default
            data: {
              name: node.user_name, // Set name
              title: node.manager_name || '', // Set title, default to empty if null
            },
            children: this.transformSubordinates(node.subordinates) // Transform subordinates recursively
          }));
  
          this.data = transformedData; // Assign transformed data
        } else {
          console.error('Unexpected data structure:', res);
        }
      },
      error: (err: any) => {
        // Handle error appropriately
        console.error('Error fetching organizational chart data:', err);
        // this.toaster.showError(err.error.error) // Uncomment to show error to user
      }
    });
  }
  
  // Helper method to transform subordinates
  private transformSubordinates(subordinates: any[]): any[] {
    return subordinates.map((sub: any) => ({
      label: sub.user_name, // Use user_name as label for subordinates
      type: 'person',
      styleClass: 'p-person',
      expanded: true, // Set expanded to true if you want to show the children by default
      data: {
        name: sub.user_name, // Set name for the subordinate
        title: sub.user_role || '', // Set title, default to empty if null
        gender:sub.gender,
        supportGroup:sub.support_group,
        email_id:sub.email_id,
        mobile_no:sub.mobile_no,
         image:sub.user_profile
      },
      children: this.transformSubordinates(sub.subordinates) // Recursively transform further subordinates
    }));
  }

  
}