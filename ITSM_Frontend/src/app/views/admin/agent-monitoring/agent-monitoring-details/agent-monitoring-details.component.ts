import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subject, takeUntil } from 'rxjs';
import { ToasterService } from 'src/app/Services/toaster.service';
import { WebsocketService } from 'src/app/Services/websocket.service';

@Component({
  selector: 'app-agent-monitoring-details',
  templateUrl: './agent-monitoring-details.component.html',
  styleUrls: ['./agent-monitoring-details.component.scss']
})
export class AgentMonitoringDetailsComponent {
  @ViewChild('fileInput') fileInput!: any;
  private destroy$ = new Subject<void>();
  deviceDetails: any = [];
  showUsageTime: boolean = false;
  showInstalledApps: boolean = false;
  showDeviceConnect: boolean = false;
  showWindowsUpdate: boolean = false;
  showSendDocumentCard: boolean = false;
  showQuickAssistCodeDialog: boolean = false;
  deviceObjectID: any;
  code: any;
  selectedFile: any = [];
  deviceUsageDetails: any;
  showCard: boolean = false;
  totalUseTime:any;
  result: any;
  isOption: boolean = false;
  usageTimeDetails: any;
  loading: boolean = false;
  windowsUpdate: any = [];
  showCommandlineInterface: boolean = false;
  usageTimePerApp: any;
  message: any;
  commandResult: any=[];
  

  byteArray: Uint8Array | null = null;

  constructor(
   
    private route: ActivatedRoute,
    private toast:ToasterService,
    private webSocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    
    this.route.params.subscribe((params) => {
      const id = params['id'];
      this.webSocketService.productDetails$.subscribe({
        next: (res) => {
          if (res) {
            this.deviceDetails = res.filter(
              (data: any) => data.other_info.unique_id == id
            );
            // console.log(this.deviceDetails);
          } else {
            var storedData: any = JSON.parse(
              localStorage.getItem('agentDetails') || ''
            );
            this.deviceDetails = storedData.filter(
              (data: any) => data.other_info.unique_id == id
            );
            // console.log(this.deviceDetails);
          }
        },
        error: (error) => {
          console.log(error);
        },
      });
    });
    this.webSocketService.connect(this.deviceDetails[0].connectionGroup);
  }
  getKeys(obj: any): any[] {
    return Object.keys(obj);
  }
  removeSelectedFile(fileInput: HTMLInputElement) {
    fileInput.value = '';
    this.selectedFile = [];
    this.byteArray = null;
  }

  //Request to connect agent by quick assist code
  connectWithAgent(code:any) {
    ;
    this.webSocketService.connectAgentbyQuickAssistCode(
      this.deviceDetails[0].connectionGroup,code
    );
    // Subscribe to messages
    this.webSocketService.messages.subscribe((message) => {
      this.showQuickAssistCodeDialog = false;
    });
  }
  //Open Quick Assist Dialog
  openQuickAssistCodeDialog() {
    this.code = '';
    this.showQuickAssistCodeDialog = true;
  }

  //open command excecution interface dialog
  openCommandInterface() {
    if(this.deviceDetails[0].status != 'Offline')
    {
      this.showCommandlineInterface = true;
    }
    else
    {
      this.toast.showInfo('Device is offline')
    }
  }

  //get windows update
  getWindowsUpdate() {
    if(this.deviceDetails[0].status=='Online')
    {
      this.showWindowsUpdate = true;
      this.webSocketService.getWindowsUpdate(
        this.deviceDetails[0].connectionGroup
      );
      // Subscribe to messages
      this.webSocketService.messages.subscribe((message) => {
        if (message.message) {
          this.windowsUpdate = message.message;
        }
      });
    }
    else{
      this.toast.showInfo("Device is offline");
    }
   
  }

  //Request to connect agent by quick assist code
  sendMessage() {
    ;
    this.webSocketService.getCMDCommandResult(
      this.deviceDetails[0].connectionGroup,
      this.message
    );
    // Subscribe to messages
    this.webSocketService.messages.subscribe((message) => {
      if (message && message.output) {
        this.formatDates(message.output);

        this.message='';
      }
      else if(message.output=="")
      {
        
      }
    });
  }

  //clear command excecution interface message
  clear() {
    this.commandResult=[];
    this.message='';
  }
 
formatDates(input:any) {
      const lines = input.split('\n').filter((line:any) => line.trim().length > 0);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const date = parts[0];
        const time = parts[1];
        const type = parts[2];
        const size = parts[3].replace(',', ''); // Remove comma from size if present
        const name = parts.slice(4).join(' '); // Join the remaining parts for the name
        this.commandResult.push({ date, time, type, size, name });
      }
    }
}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = [];
      this.byteArray = null;
      this.selectedFile = input.files;
      const file = input.files[0]; // Get the first selected file
    }
  }

  uploadFile(): void {
    if (this.selectedFile) {
      const reader = new FileReader();

      reader.onload = (e) => {
        this.byteArray = new Uint8Array(reader.result as ArrayBuffer);
        // console.log(this.byteArray);
        // Send the byte data through WebSocket
        if (this.byteArray) {
          this.webSocketService.send(this.byteArray);
          this.selectedFile = [];
          this.webSocketService.getFileMessages.subscribe((message) => {
            if (message.message) {
              const data = JSON.parse(message.message); // Assuming message.data is a string
              const parsedMessage = data;
              if (parsedMessage.sent_file.status === 200) {
                this.toast.showSuccess('File downloaded successfully');
              }
            }
          });
        }
      };
      reader.readAsArrayBuffer(this.selectedFile[0]); // Read file as ArrayBuffer
    } else {
      console.error('No file selected for upload.');
    }
  }

  hideDialog1() {
    this.showQuickAssistCodeDialog = false;
  }
  getusageTime() {
    
  this.usageTimeDetails = {};
  this.totalUseTime="";
    var patchpromise = new Promise<any>((resolve, reject) => {
      this.webSocketService
        .getUsageTimeOfDevice(this.deviceObjectID)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: any) => {
          this.deviceUsageDetails = res;
          this.usageTimeDetails = this.deviceUsageDetails;
          this.convertSeconds(this.usageTimeDetails.total_use_time);
          this.usageTimePerApp = this.usageTimeDetails.usage_time_of_apps;

          resolve('patching');
        });
    });
  }

  

  //convert seconds into hours and min

  convertSeconds(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    this.totalUseTime = hours+":"+minutes;
  }
  //Opens dialog for showing installed apps
  InstalledApps() {
    this.showInstalledApps = true;
  }
  extractKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  //Opens dialog for showing usage time
  showAppsUsageTime(data: any) {
    this.showUsageTime = true;
    this.deviceObjectID = data;
    this.getusageTime();
  }
  ngOnDestroy(): void {
    localStorage.removeItem('agentDetails');
  }

}
