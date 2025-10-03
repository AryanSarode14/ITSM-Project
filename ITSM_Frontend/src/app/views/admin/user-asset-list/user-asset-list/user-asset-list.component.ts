import { Component, ViewChild } from '@angular/core';
import * as FileSaver from 'file-saver';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AssetsService } from 'src/app/Services/assets.service';
import { ToasterService } from 'src/app/Services/toaster.service';
import { WebsocketService } from 'src/app/Services/websocket.service';

@Component({
  selector: 'app-user-asset-list',
  templateUrl: './user-asset-list.component.html',
  styleUrls: ['./user-asset-list.component.scss']
})
export class UserAssetListComponent {
  subscription!: Subscription;
  @ViewChild('dv') dv!: DataView;
  message: any;
  layout: "list" = "list";
  products: any;
  isMobileScreen!: boolean;
  filteredProducts: any=[];
  assetListData:any=[];
  isLoading?: boolean;
  filteredProducts1:any[]=[];
  parsedUserData:any;
  status:any;
  private destroy$ = new Subject<void>();

  constructor(
    private webSocketService: WebsocketService,
    private assetService:AssetsService,
    private toaster: ToasterService,

  ) {
    
    const userData = localStorage.getItem('userData'); 
    this.parsedUserData = userData ? JSON.parse(userData) : null;
    this.getAssets(this.parsedUserData.user_id);
   
   }

  ngOnInit(): void {

  }
  getAssets(userID:any){
    this.assetService
    .getAssetsbyUser(userID)
    .subscribe({
      next: (res: any) => {
        if(res.success==true){
          this.assetListData=res.assets;
          this.toaster.showSuccess('Records are retrived successfully');
        }
       
      },
      error: (err: any) => {
        this.toaster.showError(err.error.error);
      },
    });
  }
  getSeverity(product: string) {
    switch (product) {
      case 'Online':
        return 'success';
      case 'Offline':
        return 'danger';
      default:
        return 'unknown';  // Default return value for unknown statuses
    }
  };
  
 
  onInputChange(event: any) {
    const inputValue = event.target.value.toLowerCase();
    if (inputValue !== null && inputValue !== undefined) {
      this.filteredProducts = this.assetListData.filter((product: any) =>
        Object.values(product).some((value: any) =>
          value.toString().toLowerCase().includes(inputValue)
        )
      );
    } else {
      this.filteredProducts = [...this.assetListData];
    }
  }
    //surrender asset
    surrenderAsset(event: any) {
      debugger
      this.assetService.surrenderAssetbyAssetID(event.asset_id).subscribe({
        next: (rowData: any) => {
          if (rowData.success == true) {
            this.toaster.showSuccess(rowData.message);
            this.getAssets(this.parsedUserData.user_id);
          }
        },
        error: (err: any) => {
          this.toaster.showError('Error fetching asset details');
        },
      });
    }
 
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
   
  }
}
