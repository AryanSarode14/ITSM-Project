import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToasterService {
  constructor(private messageService: MessageService) { }

  showSuccess(message: string) {
    this.messageService.add({ key: 'br', severity: 'success',  detail: message, life: 700 });
  }

  showError(message: string) {
    this.messageService.add({ key: 'br', severity: 'error',  detail: message, life: 1000 });
  }

  showInfo(message: string) {
    this.messageService.add({ key: 'br', severity: 'info', detail: message, life: 1000  });
  }

  showWarn(message: string) {
    this.messageService.add({ key: 'br', severity: 'warn', detail: message, life: 1000  });
  }

}