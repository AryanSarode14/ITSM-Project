import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { ManagementService } from 'src/app/Services/management.service';
import { DatePipe } from '@angular/common';
import { ToasterService } from 'src/app/Services/toaster.service';
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  providers: [DatePipe]

})
export class AdminDashboardComponent {
  callModeLineChartData: any;
  @ViewChild('SLACalendar') SLACalendar: any;
  lineChartOptions: any;
  openIncidentsbyPriority: any;
  filterSLAValue: any = 1;
  rangeSLADates: Date[] | undefined;
  filterData1 = '7';
  lightblue1 = '#b6dff9';
  primaryBlue = '#052c65'; // Dark blue for primary color
  lightBlue = '#1e4f8a'; // A lighter blue shade
  mediumBlue = '#306eb2'; // A medium blue tone
  incidentData: any;
  // View size of the chart
  view: [number, number] = [300, 200];
  userData: any;

  canvas = document.createElement('canvas');
  ctx = this.canvas.getContext('2d');
  assetsByStatus: any;
  assetData: any;
  showSLAChartFilter: boolean = false;
  incidentTypesData: any;
  filterOptions: any = [
    { id: 'Last 24 hours', value: '1' },
    { id: 'Last 7 days', value: '7' },
    { id: 'Last 14 days', value: '14' },
    { id: 'Select date', value: 'Select date' },
  ];
  assetsOverviewData: any = [];
  callModesData: any;
  slaOverviewData: any;
  incidentStatusData: any;
  slaStartDate: any;
  slaEndDate: any;
  callTypesData: any;
  currentRole:any;
  incidentDetails = [
    { label: 'Laptop', value: 9 },
    { label: 'Desktop', value: 2 },
    { label: 'Server', value: 1 },
  ];
  chartOptions: any;
  incidentOptions: {
    scales: {
      y: {
        grid: { display: boolean };
        beginAtZero: boolean; // Optional: Ensure Y-axis starts at 0
      };
      x: { grid: { display: boolean } };
    };
    plugins: { legend: { display: boolean } };
  };
  constructor(
    private managementService: ManagementService,
    private toaster: ToasterService,
    private datePipe: DatePipe,
    private router: Router
  ) {
    const primaryBlue = '#052c65'; // Dark blue for primary color
    const lightBlue = '#1e4f8a'; // A lighter blue shade
    const mediumBlue = '#306eb2'; // A medium blue tone
    const lightblue1 = '#b6dff9';


    const storedUserData = localStorage.getItem('userData');

    // Parse the stored string into an object
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      
      // Access the 'role' property
      this.currentRole= userData.role;
      
     // Output: Administrator
    }

    this.getUserData();
    this.getAssetData();
    this.getincidentData(1,'','');
    // Create a canvas element to use its context for the gradient

    // Define the options to remove grid lines
    this.incidentOptions = {
      scales: {
        y: {
          grid: {
            display: false, // Remove grid lines for Y-axis
          },
          beginAtZero: true, // Optional: Ensure Y-axis starts at 0
        },
        x: {
          grid: {
            display: false, // Remove grid lines for X-axis
          },
        },
      },
      plugins: {
        legend: {
          display: true, // Show the legend if you want
        },
      },
    };

    if (this.ctx) {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, 400); // Vertical gradient
      gradient.addColorStop(1, '#113142');
      gradient.addColorStop(0, lightblue1);

      // Chart options to control the doughnut width and appearance
      // this.chartOptions = {
      //   cutout: '60%', // Reduce the doughnut hole size (makes the chart narrower)
      //   responsive: true,
      //   aspectRatio: 1.5, // Make the chart a square
      //   plugins: {
      //     legend: {
      //       position: 'bottom',
      //       labels: {
      //         color: '#fff' // Change text color if needed
      //       }
      //     }
      //   },
      //   maintainAspectRatio: false, // Allow controlling width/height

      //   layout: {
      //     padding: 25 // Add padding if needed to control size
      //   }
      // };
    }

    this.chartOptions = {
      // cutout: '40%',
      datalabels: {
        display: false, // Disable data labels entirely from the doughnut chart
      },
      aspectRatio: 1.5, // This controls the width-to-height ratio, reducing the width
      maintainAspectRatio: false,
      // elements: {
      //   arc: {
      //     borderWidth: 2 // Remove the circle line (border) around the segments
      //   }
      // }
    };

    this.lineChartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top', // Legend at the top
        },
      },
      scales: {
        x: {
          display: true, // Show X-axis
          title: {
            display: true,
            text: 'Users Levels', // X-axis title
            color: '#000',
          },
          beginAtZero: true, // X-axis starts from 0
        },
        y: {
          display: true, // Show Y-axis
          title: {
            display: true,
            text: 'Count', // Y-axis title
            color: '#000',
          },
          type: 'linear', // Ensure Y-axis is linear
          beginAtZero: true, // Y-axis starts from 0
          ticks: {
            // Configure the number of ticks on the Y-axis
            stepSize: 5, // This sets the step size of ticks (e.g., 0, 5, 10, ...)
            // max: 80 // Adjust the maximum value to suit your data
          },
        },
      },
    };
  }

  viewAllUsers(): void {
    this.router.navigate(['/admin/user-management']); // Navigate to the user list page
  }

  closeSLACalendar() {
    this.SLACalendar.toggle();
  }

  getUserData() {
    const gradient = this.ctx?.createLinearGradient(0, 0, 0, 400); // Vertical gradient
    gradient?.addColorStop(1, '#113142');
    gradient?.addColorStop(0, this.lightblue1);

    this.managementService.getAllData('api/usercount').subscribe({
      next: (res: any) => {
        this.userData = res;
        // this.toaster.showSuccess("Record Loaded Successfully")
        // console.log("user",res);
        const typeLabels = res.user_levels?.map((item: any) => item.level_name);
        const typeCounts = res.user_levels?.map((item: any) => item.user_count);

        this.callModeLineChartData = {
          labels: [...typeLabels], // X-axis labels (Levels)
          datasets: [
            {
              label: 'Users',
              data: [...typeCounts], // Data for users at each level
              borderColor: '#1E88E5', // Line color
              borderWidth: 3,
              fill: false, // No fill under the line
              tension: 0.4, // Curved line,
              pointBackgroundColor: ['#f925ec'], // Custom circle colors for each data point
              pointBorderColor: '#113142', // Optional: Border color of each point
            },
          ],
        };
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  dataBetweenSLADates() {
    
    if (this.rangeSLADates) {
      this.SLACalendar.toggle();
      this.slaStartDate = this.datePipe.transform(
        this.rangeSLADates[0],
        'yyyy-MM-dd'
      );
      this.slaEndDate = this.datePipe.transform(
        this.rangeSLADates[1],
        'yyyy-MM-dd'
      );
    this.getincidentData('',this.slaStartDate,this.slaEndDate)
    } else {
      this.toaster.showInfo('Please provide a date range!');
    }
  }

  getAssetData() {
    const gradient = this.ctx?.createLinearGradient(0, 0, 0, 400); // Vertical gradient
    gradient?.addColorStop(1, '#113142');
    gradient?.addColorStop(0, this.lightblue1);
    this.managementService.getAllData('api/assetcount').subscribe({
      next: (res: any) => {
        this.assetData = res;
        // this.toaster.showSuccess("Record Loaded Successfully");
        // console.log("res", res);

        const typeLabels = res.asset_type_data?.map(
          (item: any) => item.asset_type_name
        );
        const typeCounts = res.asset_type_data?.map(
          (item: any) => item.asset_type_count
        );

        // You can combine the categories and types into one dataset or separate them based on your chart's goal
        this.assetsOverviewData = {
          labels: [...typeLabels], // Combine category and type labels
          datasets: [
            {
              data: [...typeCounts], // Combine category and type counts
              backgroundColor: [gradient, '#91dbf5'], // Customize your colors
              hoverBackgroundColor: [gradient, '#91dbf5'], // Customize hover colors
              borderWidth: 1, // Control the width of the doughnut border
            },
          ],
        };
        const IncidenttypeLabels = res.asset_ci_category_data?.map(
          (item: any) => item.ci_category_name
        );
        const IncidenttypeCounts = res.asset_ci_category_data?.map(
          (item: any) => item.asset_ci_category_count
        );

        this.incidentTypesData = {
          labels: [...IncidenttypeLabels],
          datasets: [
            {

              label: 'Asset By Category',
              data: [...IncidenttypeCounts],
              backgroundColor: (context: { chart: any }) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;

                if (!chartArea) {
                  return null;
                }

                const gradient = ctx.createLinearGradient(
                  0,
                  chartArea.top,
                  0,
                  chartArea.bottom
                );
                gradient.addColorStop(0, '#dcf1fd');
                gradient.addColorStop(1, '#1377b1');

                return gradient;
              },
              barThickness: 20,
              maxBarThickness: 30,
            },
          ],

        };

        // Get asset count by status
        const assetStatusLabels = res.asset_status_data?.map(
          (item: any) => item.status_name
        );
        const assetStatusCounts = res.asset_status_data?.map(
          (item: any) => item.asset_count
        );

        this.assetsByStatus = {
          labels: [...assetStatusLabels],
          datasets: [
            {
              data: [...assetStatusCounts],
              backgroundColor: ['#30bfe6', '#1b96dc'],
            },
          ],

        };

            
        // Optionally, you could use separate charts for categories and types if needed.
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }

  onChangeSLA(event: any) {
    
    if (event.value == 'Select date') {
      this.showSLAChartFilter = true;
      
    } else {
      this.showSLAChartFilter = false;
      this.slaStartDate = '';
      this.slaEndDate = '';
      this.filterSLAValue = event.value;
      this.getincidentData(this.filterSLAValue,'','');

      // this.subscription = this.admin
      //   .getDashboardFilterSLAData(
      //     this.slaStartDate,
      //     this.slaEndDate,
      //     event.value
      //   )
      //   .subscribe({
      //     next: (res: any) => {
      //       let slaData = res.result['SLA Count'];
      //       this.SLACountData = Object.values(slaData).map((value: any) =>
      //         parseInt(value, 10)
      //       );
      //       if (
      //         this.SLACountData[0] == 0 &&
      //         this.SLACountData[1] == 0 &&
      //         this.SLACountData[2] == 0
      //       ) {
      //         this.showSLAMsg = true;
      //       } else {
      //         this.showSLAMsg = false;
      //       }
      //       this.SLAChart();
      //     },
      //     error: (error: any) => {
      //       console.log(error);
      //     },
      //   });
    }
  }
  getincidentData(days:any,sDate:any,eDate:any) {
    
    const gradient = this.ctx?.createLinearGradient(0, 0, 0, 400); // Vertical gradient
    gradient?.addColorStop(1, '#113142');
    gradient?.addColorStop(0, this.lightblue1);

    this.managementService.getDashboardDetailsForIncident(days,sDate,eDate).subscribe({
      next: (res: any) => {
        this.incidentData = res;
        // this.toaster.showSuccess("Record Loaded Successfully")
        // console.log("incidentcounts",res);


        //set data for call type chart

        const IncidenttypeLabels = res.call_type_data?.map(
          (item: any) => item.call_type_name
        );
        const IncidenttypeCounts = res.call_type_data?.map(
          (item: any) => item.call_type_count
        );

        this.callTypesData = {
          labels: [...IncidenttypeLabels],
          datasets: [
            {
              label: 'Incident Types',
              data: [...IncidenttypeCounts],
              backgroundColor: ['#3c73f2', gradient],
            },
          ],
        };


        //set data for call mode chart
        const callModeLabels = res.call_mode_data?.map(
          (item: any) => item.call_mode_name
        );
        const callModeCounts = res.call_mode_data?.map(
          (item: any) => item.call_mode_count
        );

        this.callModesData = {
          labels: [...callModeLabels],
          datasets: [
            {
              label: 'Call Mode',
              data: [...callModeCounts],
              backgroundColor: ['#3c73f2', gradient],
            },
          ],
        };
        //set data for sla chart
        const slaLabels = res.sla_data?.map((item: any) => item.slaname);
        const slaCounts = res.sla_data?.map((item: any) => item.count);

        this.slaOverviewData = {
          labels: [...slaLabels],
          datasets: [
            {
              data: [...slaCounts],
              backgroundColor: ['#30bfe6', '#1b96dc'],
            },
          ],
        };

        const statusLabels = res.status_data?.map(
          (item: any) => item.status_name
        );
        const statusCounts = res.status_data?.map(
          (item: any) => item.status_count
        );

        this.incidentStatusData = {
          labels: [...statusLabels],
          datasets: [
            {
              label: 'Incident Status',
              data: [...statusCounts],
              backgroundColor: ['#1b96dc', '#5ceef8', '#30bfe6'],
            },
          ],
        };
        // Get incident count by priority
        const priorityLabels = res.priority_count?.map(
          (item: any) => item.priority_name
        );
        const priorityCounts = res.priority_count?.map(
          (item: any) => item.priority_count
        );

        this.openIncidentsbyPriority = {
          labels: [...priorityLabels],
          datasets: [
            {
              data: [...priorityCounts],
              backgroundColor: ['#30bfe6', '#1b96dc', '#0b5ed7', '#c5dcff'],
            },
          ],
          

          options: { 
            plugins: {
              tooltip: {
                enabled: true, // You can enable/disable tooltips here if needed
              },
              datalabels: {
                display: false, // This disables the count in the center
              },
            },
        }
        };
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
}
