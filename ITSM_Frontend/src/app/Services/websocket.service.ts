import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { HttpClient } from '@angular/common/http';
import { ToasterService } from './toaster.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any>;
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<any>();
  private productDetailsSubject = new BehaviorSubject<any>(null);
  productDetails$ = this.productDetailsSubject.asObservable();
  public messages: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor( private toast:ToasterService, private _http: HttpClient) {
    //web socket connection
   // const token = JSON.parse(localStorage.getItem('token') || '');
    // this.socket$ = webSocket({url: `wss://172.16.15.251:9000/web_client/`});
    this.socket$ = webSocket({ url: `wss://csm.augtrans.com:8224/web_client/` });
    //  this.connect();
  }

  public connectwebsocket() {
      this.socket$ = webSocket('wss://csm.augtrans.com:8224/web_client/');
      this.socket$.subscribe(
        message => this.messageSubject.next(message),
        error => this.reconnect(),
        () => this.reconnect()
      );
      return this.socket$;
    }

  public reconnect() {
    setTimeout(() => {
       this.connectwebsocket();
    }, 5000);
  }
  //for send message to web socket
  sendMessage(message: any) {
    if (!this.socket$) {
      throw new Error('WebSocket connection not established.');
    }
    this.socket$.next(message);
  }

  //get response from web socket
  getMessage() {
    if (!this.socket$) {
      throw new Error('WebSocket connection not established.');
    }
    return this.socket$;
  }

  //get windows update
  getWindowsUpdate(deviceID: string) {
    const wsConnectionUrl = `wss://csm.augtrans.com:8224/agctl/${deviceID}/`;
    this.socket$ = webSocket(wsConnectionUrl);

    this.socket$.subscribe(
      (message) => this.handleWindowsUpdateMessage(message),
      (err) => this.handleError(err),
      () => console.log('Connection closed')
    );

    // Send initial message after connection is established
    this.socket$.next({ cmd: 'check_windows_update' });
  }
  //get device current location
  getDeviceCurrentLocation(deviceID: string) {
    const wsConnectionUrl = `wss://csm.augtrans.com:8224/agctl/${deviceID}/`;
    this.socket$ = webSocket(wsConnectionUrl);

    this.socket$.subscribe(
      (message) => this.handleMessage(message),
      (err) => this.handleError(err),
      () => console.log('Connection closed')
    );

    // Send initial message after connection is established
    this.socket$.next({ cmd: 'get_loc' });
  }

  //get cmd command output result
  getCMDCommandResult(deviceID: string,message:any) {
    const wsConnectionUrl = `wss://csm.augtrans.com:8224/agctl/${deviceID}/`;
    this.socket$ = webSocket(wsConnectionUrl);

    this.socket$.subscribe(
      (message) => this.handleCommandOutputMessage(message),
      (err) => this.handleError(err),
      () => console.log('Connection closed')
    );

    // Send initial message after connection is established
    this.socket$.next({ cmd: message });
  }
  connectAgentbyQuickAssistCode(deviceID: string,code:any) {
    ;
    const wsConnectionUrl = `wss://csm.augtrans.com:8224/agctl/${deviceID}/`;
    this.socket$ = webSocket(wsConnectionUrl);

    this.socket$.subscribe(
      (message) => this.handleQuickAssistCodeMessage(message),
      (err) => this.handleError(err),
      () => console.log('Connection closed')
    );

    // Send initial message after connection is established
    this.socket$.next({ "quick_assist_code": code });
  }
  //for handling windows update message
  private handleWindowsUpdateMessage(message: any) {
    // console.log('On message received:', message);

    if (message.length > 0) {
    }

    this.messages.next(message); // Notify subscribers
  }

  //for handling location message
  private handleMessage(message: any) {
    
    console.log('On message received:', message);
    const data = JSON.parse(message.message); // Assuming message.data is a string
    const parsedMessage = data;

    if (parsedMessage.status === 'success') {
      this.toast.showSuccess('Location Updated Successfully');
    } 
    this.messages.next(parsedMessage); // Notify subscribers
  }

  //for handling quick assist code message
  private handleQuickAssistCodeMessage(message: any) {
    ;
    // console.log('On message received:', message);
    const data = message.message;
    if (data.Quick_assist_status === true) {
      this.toast.showInfo(data.msg);
    } else if (data.Quick_assist_status === false) {
      this.toast.showInfo(data.msg);
    }
    this.messages.next(data); // Notify subscribers
  }

  //for handling command output message
  private handleCommandOutputMessage(message: any) {
    ;
    const data = JSON.parse(message.message); // Assuming message.data is a string
    const parsedMessage = data;
   
    this.messages.next(parsedMessage); // Notify subscribers
  }
  private handleError(err: any) {
    console.error('WebSocket error:', err);
    this.toast.showInfo('Device is offline');
  }

  //to get device usage time
  getUsageTimeOfDevice(deviceObjectID: any): Observable<any> {
    return this._http.get<any>(
      `https://csm.augtrans.com:8224/usagetime/${deviceObjectID}`
    );
  }

  //to get device usage time
  getdownloadAgentLink(): Observable<any> {
    return this._http.get<any>(
      `https://csm.augtrans.com:8224/get_agent/`
    );
  }
  closeConnection() {
    if (this.socket$) {
      this.socket$.complete(); // This will close the WebSocket connection
    }
  }
  //for device details
  setProductDetails(details: any[]): void {
    this.productDetailsSubject.next(details);
    localStorage.setItem('agentDetails', JSON.stringify(details));
  }
  public get getFileMessages() {
    return this.messageSubject.asObservable();  // Return the observable
  }
  connect(deviceId: string): void {
    const url = `wss://csm.augtrans.com:8224/agctl/${deviceId}/`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    this.socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      this.messageSubject.next(data);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  send(rawData: Uint8Array): void {
    ;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(rawData);
      this.toast.showSuccess('File transferred successfully.');
    } else {
      console.error('WebSocket is not open. Unable to send data.');
    }
  }
}
