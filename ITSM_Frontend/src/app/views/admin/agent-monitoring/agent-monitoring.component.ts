import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as FileSaver from 'file-saver';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { WebsocketService } from 'src/app/Services/websocket.service';


@Component({
  selector: 'app-agent-monitoring',
  templateUrl: './agent-monitoring.component.html',
  styleUrls: ['./agent-monitoring.component.scss']
})
export class AgentMonitoringComponent implements OnInit, OnDestroy{
  subscription!: Subscription;
  @ViewChild('dv') dv!: DataView;
  message: any;
  layout: "list" | "grid" = "grid";
  products: any;
  isMobileScreen!: boolean;
  filteredProducts: any=[];
  isLoading?: boolean;
  filteredProducts1:any[]=[];
  onlineDevicesCount=0;
  offlineDevicesCount=0;
  status:any;
  private destroy$ = new Subject<void>();

  constructor(
    private webSocketService: WebsocketService,

  ) {
    
    this.subscription = this.webSocketService.connectwebsocket().subscribe({
      next: (message:any) => {
      }
      })
   }

  ngOnInit(): void {
    this.onlineDevicesCount=0;
    this.offlineDevicesCount=0;
    this.isLoading = true;
   

    this.subscription = this.webSocketService.getMessage().subscribe({
      next: (message:any) => {
        // console.log(message, 'Updated message')
        if (message && message?.data) {
          this.isLoading = false;
          this.products=message.data;
          this.filteredProducts = message.data;
          this.filteredProducts.forEach((element:any) => {
            this.filteredProducts1.push({
              status:element.connection_id!=null?'Online':'Offline',
              connectionGroup:element.connection__group,
              other_info:JSON.parse(element.other_info),
              location:element.device_location,
              deviceObjectID:element.id,
              updated_at:element.updated_at
            })
          });
          this.onlineDevicesCount=this.filteredProducts1.filter((ele:any)=>ele.status=='Online').length;
          this.offlineDevicesCount=this.filteredProducts1.filter((ele:any)=>ele.status=='Offline').length;
          this.filteredProducts1=[...this.filteredProducts1];
          // this.filteredProducts1.forEach((ele:any)=>{
          // this.webSocketService.setProductDetails(ele);
          // })
          this.webSocketService.setProductDetails(this.filteredProducts1);
          this.isLoading = false;
          // console.log(JSON.stringify(this.filteredProducts));
        }
        else {
          // console.log("No message");
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
      }
    });
  }
  //get current device location by device id
  getLocation(deviceID:any){
    
    this.webSocketService.getDeviceCurrentLocation(deviceID);
     // Subscribe to messages
     this.webSocketService.messages.subscribe((message) => {
      if (message && message?.city) {
       const updatedItems = this.filteredProducts1.map((item:any) => 
          item.connectionGroup === deviceID ? { ...item, location: message.city } : item
        );
        this.filteredProducts1 = updatedItems;
      }
    });
  }
  getSeverity(product: string) {
    switch (product) {
      case 'Online':
        return 'success';
      case 'Offline':
        return 'danger';
      default:
        return 'unknown';  // Default return value
    }
  };
  
 
  onInputChange(event: any) {
    const inputValue = event.target.value.toLowerCase();
    if (inputValue !== null && inputValue !== undefined) {
      this.filteredProducts = this.products.filter((product: any) =>
        Object.values(product).some((value: any) =>
          value.toString().toLowerCase().includes(inputValue)
        )
      );
    } else {
      this.filteredProducts = [...this.products];
    }
  }
  
  downloadAgent() {
    
    var patchpromise = new Promise<any>((resolve, reject) => {
      this.webSocketService
        .getdownloadAgentLink()
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: any) => {
       if(res.status==true){
        const url = res.file_url;
            fetch(url)
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.blob();
            })
            .then(blob => {
              if (confirm('You are about to download a suspicious file. Do you want to proceed?')) {
              this.isLoading = false;       
              const fileName = 'agent_app.exe'; // Replace with desired file name
              FileSaver.saveAs(url, fileName);
              }
              else
              {

              }
            })
       }
          resolve('patching');
        });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.webSocketService.closeConnection(); // Clean up on component destruction
  }

}
