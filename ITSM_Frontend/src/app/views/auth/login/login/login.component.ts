import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AssetsService } from 'src/app/Services/assets.service';
import { AuthService } from 'src/app/Services/auth.service';
import { ToasterService } from 'src/app/Services/toaster.service';

export interface Message {
  messageType: string;
  message: SafeHtml;
  srNo: any;
  options?: any[];
  type: string;
  userOption: any;
}
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading: boolean = false;
  isOpen: boolean = false;
  lastClientMsg: any;
  label1: string = 'Raise an Issue';
  optionsData: any = [];
  userMessage: any = [];
  ticketNo: any;
  prev_notesData: any = [];
  submitted = false;
  returnUrl: string = '';
  error = '';
  uniqueMessageRecords: any = [];
  userType: any;
  isOption: boolean = false;
  disableInput: boolean = false;
  chatForm!: FormGroup;
  lastClientMsgArray: any = [];
  userData: any;
  showOption: boolean = false;
  clientQuestions = [
    { userOption: 1, questionName: 'Create Ticket' },
    { userOption: 2, questionName: 'Know the ticket status' },
    { userOption: 3, questionName: 'Escalate Ticket' },
  ];
  newConversation = ['Start New Conversation'];
  disableOption: boolean = false;
  messages: Message[] = [];
  optionsData1: any = [];
  userAssetData: any = [];
  loading: boolean = false;
  assetOptions: any = [];
  userMessagesBack: any = [];
  userEmail: string = '';
  questionData: any;
  @ViewChild('scrollMe') private myScrollContainer: any;

  questionResult: any = [
    {
      srNo: 1,
      question: 'Enter your valid email id',
      options: ['Back'],
      type: '',
    },
    {
      srNo: 2,
      question:
        'We have sent a OTP to your registered email address. Please check your inbox and enter OTP',
      options: ['Back'],
      type: '',
    },
    {
      srNo: 3,
      question: 'Enter your phone number',
      options: ['Back'],
      type: '',
    },
    {
      srNo: 4,
      question: 'Choose your organization',
      options: ['OTW', 'Back'],
      type: '',
    },
    {
      srNo: 5,
      question: 'Choose your location',
      type: 'OTW',
      options: ['Pune', 'Mumbai', 'Goa', 'Back'],
    },

    {
      srNo: 6,
      question: 'Choose your branch',
      type: 'Pune',
      options: ['Shivneri', 'Bavdhan', 'Warehouse', 'Back'],
    },
    {
      srNo: 6,
      question: 'Choose your branch',
      type: 'Mumbai',
      options: ['Bhandup', 'Marol', 'Back'],
    },
    {
      srNo: 6,
      question: 'Choose your branch',
      type: 'Goa',
      options: ['Goa', 'Back'],
    },
    {
      srNo: 7,
      question: 'Choose your service',
      options: ['IT', 'Back'],
      type: '',
    },
    {
      srNo: 8,
      question: 'Choose your issue related To',
      options: ['Laptop', 'Windows', 'MS Office', 'SAP', 'HRMS', 'Back'],
      type: '',
    },
    ,
    {
      srNo: 9,
      question: 'Choose your Asset',
      options: [],
      type: '',
    },
    {
      srNo: 10,
      question: 'Enter detailed description of issue',
      options: ['Back'],
      type: '',
    },
    {
      srNo: 11,
      question: 'Are you sure you want to create the ticket ? ',
      options: ['Yes', 'No'],
      type: '',
    },
  ];
  userOption: any;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private assetService: AssetsService,
    private toasterService: ToasterService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
    });
    this.chatForm = this.fb.group({
      message: [
        { value: '', disabled: this.disableInput },
        [Validators.required],
      ],
    });
    this.messages.push({
      messageType: 'client',
      message: 'Hi,Welcome to ITSM!! Select the option',
      options: this.clientQuestions.map((ele: any) => ele.questionName),
      type: '',
      srNo: 0,
      userOption: 0,
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    
    if (this.loginForm.value) {
      this.isLoading = true;

      this.authService.login(this.loginForm.value).subscribe({
        next: (res: any) => {
          // console.log(res);
          if(res.message=='Login successful')
          {
            this.router.navigateByUrl('admin/admin-dashboard');
            this.toasterService.showSuccess('Login success!');
            this.isLoading = false;
          }
         
        },
        error: (err: any) => {
          this.toasterService.showWarn(err.error.error);
          this.isLoading = false;
        },
      });
    }
  }
  openSupportPopup() {
    this.isOpen = !this.isOpen;
  }

  //validate email
  isValidEmail(email: string): boolean {
    // Regular expression for a valid email address
    // This regex covers most common cases but may not cover all edge cases
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  //validate OTP
  isValidFourDigitNumber(input: number): boolean {
    // Check if input is a number and within the range of 1000 to 9999
    return Number.isInteger(input) && input >= 1000 && input <= 9999;
  }

  //validate mobile number
  isValidMobileNumber(input: string): boolean {
    // Regular expression for a 10-digit number
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(input);
  }

  onInputChange(event: Event) {
    let inputValue = (event.target as HTMLInputElement).value;
    inputValue = inputValue.trim();

    if (inputValue.length > 10) {
      inputValue = inputValue.slice(0, 10);
      (event.target as HTMLInputElement).value = inputValue;
    }
  }

  sendMessage() {
    const sentMessage = this.chatForm.value.message!;
    this.loading = true;
    this.lastClientMsgArray = this.messages.filter(
      (ele: any) => ele.messageType == 'client'
    );
    this.lastClientMsg =
      this.lastClientMsgArray[this.lastClientMsgArray.length - 1].message;
    if (this.isValidEmail(sentMessage)) {
      this.userEmail = '';
      this.messages.push({
        messageType: 'user',
        message: sentMessage,
        options: [],
        type: '',
        srNo: 1,
        userOption: 1,
      });
      this.chatForm.reset();
      this.scrollToBottom();
      this.userEmail = sentMessage;
      const obj = {
        email: sentMessage,
        userOption: 1,
      };
      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.loading = false;
          this.userData = response.data.user;
          this.userType = response.data.type;
          this.messages.push({
            messageType: 'client',
            message: response.data.message.question,
            options: [],
            type: '',
            srNo: 1,
            userOption: 1,
          });
        } else if (response.data.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: response.data.message.question,
            options: [],
            type: '',
            srNo: 1,
            userOption: 1,
          });
        }
        this.scrollToBottom();
      });
    } else if (this.isValidFourDigitNumber(parseInt(sentMessage, 10))) {
      // this.userOption=this.messages.filter((ele:any)=>ele.messageType=='user')
      this.ticketNo = sentMessage;
      this.messages.push({
        messageType: 'user',
        message: sentMessage,
        type: '',
        options: [],
        srNo: 2,
        userOption: 1,
      });
      this.chatForm.reset();
      this.scrollToBottom();

      if (this.messages[1].userOption == 1) {
        const obj = {
          otp: sentMessage,
          user_id: this.userData.id,
          userOption: 1,
          email: this.userEmail,
        };
        this.assetService.validateOTP(obj).subscribe((response: any) => {
          if (response.data.status == 200) {
            this.questionData = response.data;
            this.optionsData = this.questionData.question;
            // if (this.questionData.assets.length != 0) {
            //   this.userAssetData = this.questionData.assets;
            // }
            this.loading = false;
            this.messages.push({
              messageType: 'client',
              message:
                this.questionData.message +
                ' ' +
                this.questionData.question.question,
              options: [],
              type: '',
              srNo: this.questionData.srNo,
              userOption: 1,
            });
          } else if (response.data.status == 401) {
            this.messages.push({
              messageType: 'client',
              message: response.data.message,
              options: [],
              type: '',
              srNo: 2,
              userOption: 1,
            });
          }
          this.scrollToBottom();
        });
      } else if (this.messages[1].userOption == 2) {
        this.prev_notesData = [];
        this.optionsData = [];
        const obj = {
          ticketno: sentMessage,
          srNo: 2,
          userOption: 2,
        };
        this.assetService.validateOTP(obj).subscribe((response: any) => {
          if (response.status == 200) {
            this.questionData = response.data;
            this.optionsData = this.questionData.logNote;
            this.loading = false;

            if (this.optionsData.length > 0) {
              this.optionsData.forEach((element: any) => {
                this.prev_notesData.push(
                  'Assigned To :' +
                    ' ' +
                    element['User Name'] +
                    '-' +
                    ' ' +
                    element['Log Notes'] +
                    '\n'
                );
              });
            } else {
              this.prev_notesData = [];
            }

            const status = `${this.questionData.Status}`;
            const issueDescription = `Issue Description:\n${this.questionData['Issue Description']}`;
            const prevNotes = `${this.prev_notesData.join('\n')}`;
            const message = this.sanitizer.bypassSecurityTrustHtml(
              `<p><strong>Status: </strong> ${this.questionData.Status}</p><p><strong>Issue Desc: </strong> ${this.questionData['Issue Description']}</p><p><strong>Prev. Notes: </br></strong> ${this.prev_notesData}</p>`
            );
            this.messages.push({
              messageType: 'client',
              message: message,
              options: this.newConversation,
              type: '',
              srNo: 0,
              userOption: 2,
            });
          } else if (response.data.status == 401) {
            this.messages.push({
              messageType: 'client',
              message: response.data.message,
              options: [],
              type: '',
              srNo: 0,
              userOption: 2,
            });
          }
          this.scrollToBottom();
        });
      } else if (this.messages[1].userOption == 3) {
        const obj = {
          ticketno: sentMessage,
          srNo: 2,
          userOption: 3,
        };
        this.assetService.validateOTP(obj).subscribe((response: any) => {
          if (response.status == 200) {
            this.questionData = response.data;
            this.loading = false;
            this.messages.push({
              messageType: 'client',
              message: this.questionData.question,
              options: this.questionData.options,
              type: '',
              srNo: 2,
              userOption: 3,
            });
          } else if (response.data.status == 401) {
            this.messages.push({
              messageType: 'client',
              message: response.data.message,
              options: [],
              type: '',
              srNo: 2,
              userOption: 3,
            });
          }
          this.scrollToBottom();
        });
      }
    } else if (this.isValidMobileNumber(sentMessage)) {
      this.messages.push({
        messageType: 'user',
        message: sentMessage,
        type: '',
        options: [],
        srNo: 4,
        userOption: 1,
      });
      this.chatForm.reset();

      this.cdr.detectChanges();
      this.scrollToBottom();
      const obj = {
        type: '',
        srNo: this.questionResult[3].srNo,
        userOption: 1,
      };
      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.optionsData = response.data;
          this.loading = false;
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.question,
            options: this.optionsData.options,
            type: '',
            srNo: this.questionResult[3].srNo,
            userOption: 1,
          });
        } else if (response.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: response.data.message,
            options: [],
            type: '',
            srNo: this.questionResult[3].srNo,
            userOption: 1,
          });
        }
        this.scrollToBottom();
      });
    } else if (this.lastClientMsg == 'Enter detailed description of issue') {
      this.messages.push({
        messageType: 'user',
        message: sentMessage,
        type: '',
        srNo: 11,
        userOption: 1,
      });
      const obj = {
        type: '',
        srNo: 11,
        userOption: 1,
      };

      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.optionsData = response.data;
          this.loading = false;
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.question,
            options: this.optionsData.options,
            type: '',
            srNo: 11,
            userOption: 1,
          });
        } else if (response.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.question,
            options: [],
            type: '',
            srNo: 11,
            userOption: 1,
          });
        }
        this.chatForm.reset();
        this.scrollToBottom();
      });
    } else {
      this.messages.push({
        messageType: 'client',
        message: 'Please enter valid message',
        options: [],
        type: '',
        srNo: 0,
        userOption: 0,
      });
      this.chatForm.reset();
      this.scrollToBottom();
    }
  }
  handleOptionSelection(option: string, type: string, srNo: any) {
    if (
      option == 'Create Ticket' ||
      option == 'Know the ticket status' ||
      option == 'Escalate Ticket'
    ) {
      this.messages.push({
        messageType: 'user',
        message: option,
        type: option,
        options: [],
        srNo: 0,
        userOption:
          option == 'Create Ticket'
            ? 1
            : option == 'Know the ticket status'
            ? 2
            : 3,
      });

      const obj = {
        srNo: 1,
        userOption:
          option == 'Create Ticket'
            ? 1
            : option == 'Know the ticket status'
            ? 2
            : 3,
        type: '',
      };
      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.optionsData = response.data;
          this.loading = false;
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.question,
            options: [],
            type: option,
            srNo: 1,
            userOption:
              option == 'Create Ticket'
                ? 1
                : option == 'Know the ticket status'
                ? 2
                : 3,
          });
        } else if (response.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.message,
            options: [],
            type: option,
            srNo: 1,
            userOption:
              option == 'Create Ticket'
                ? 1
                : option == 'Know the ticket status'
                ? 2
                : 3,
          });
        }
        this.scrollToBottom();
      });
    } else if (option == 'OTW') {
      this.messages.push({
        messageType: 'user',
        message: option,
        type: option,
        options: [],
        srNo: 5,
        userOption: 1,
      });
      const obj = {
        type: option,
        srNo: 5,
        userOption: 1,
      };
      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.optionsData = response.data;
          this.loading = false;
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.question,
            options: this.optionsData.options,
            type: option,
            srNo: 5,
            userOption: 1,
          });
        } else if (response.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.message,
            options: [],
            type: option,
            srNo: 5,
            userOption: 1,
          });
        }
        this.scrollToBottom();
      });
    } else if (option == 'Pune' || option == 'Mumbai' || option == 'Goa') {
      this.messages.push({
        messageType: 'user',
        message: option,
        type: option,
        options: [],
        srNo: 6,
        userOption: 1,
      });
      const obj = {
        type: option,
        srNo: 6,
        userOption: 1,
      };
      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.optionsData = response.data;
          this.loading = false;
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.question,
            options: this.optionsData.options,
            type: response.data.type,
            srNo: 6,
            userOption: 1,
          });
        } else if (response.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.message,
            options: [],
            type: response.data.type,
            srNo: 6,
            userOption: 1,
          });
        }
        this.scrollToBottom();
      });
    } else if (
      option == 'Shivneri' ||
      option == 'Bavdhan' ||
      option == 'Warehouse' ||
      option == 'Bhandup' ||
      option == 'Marol' ||
      option == 'Goa'
    ) {
      this.messages.push({
        messageType: 'user',
        message: option,
        options: [],
        type: option,
        srNo: 7,
        userOption: 1,
      });

      const obj = {
        type: '',
        srNo: 7,
        userOption: 1,
      };
      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.optionsData = response.data;
          this.loading = false;
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.question,
            options: this.optionsData.options,
            type: option,
            srNo: 7,
            userOption: 1,
          });
        } else if (response.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.message,
            options: [],
            type: option,
            srNo: 7,
            userOption: 1,
          });
        }
        this.scrollToBottom();
      });
    } else if (option == 'IT' || option == 'HR') {
      this.messages.push({
        messageType: 'user',
        message: option,
        type: option,
        options: [],
        srNo: 8,
        userOption: 1,
      });
      const obj = {
        type: '',
        srNo: 8,
        userOption: 1,
      };
      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.optionsData = response.data;
          this.loading = false;
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.question,
            options: this.optionsData.options,
            type: option,
            srNo: 8,
            userOption: 1,
          });
        } else if (response.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.message,
            options: [],
            type: option,
            srNo: 8,
            userOption: 1,
          });
        }
        this.scrollToBottom();
      });
    } else if (
      option == 'Laptop' ||
      option == 'Windows' ||
      option == 'MS Office' ||
      option == 'SAP' ||
      option == 'HRMS'
    ) {
      
      this.assetOptions = [];
      this.messages.push({
        messageType: 'user',
        message: option,
        type: option,
        options: [],
        srNo: 9,
        userOption: 1,
      });
      const obj = {
        type: '',
        srNo: 9,
        userOption: 1,
        user_id: this.userData != null ? this.userData.user_id : '',
      };
      this.assetOptions = [];
      this.userAssetData = [];
      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.optionsData = response.data;
          if (this.optionsData.data.options.length > 0) {
            this.userAssetData = this.optionsData.data.options;
            this.userAssetData.forEach((ele: any) =>
              this.assetOptions.push(ele.asset_name)
            );
          } else {
            this.assetOptions = [];
          }

          this.loading = false;
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.data.question,
            options: this.assetOptions,
            type: option,
            srNo: 9,
            userOption: 1,
          });
        } else if (response.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.message,
            options: [],
            type: option,
            srNo: 9,
            userOption: 1,
          });
        }
        this.scrollToBottom();
      });
    } else if (option == 'Back' && type != '') {
      this.messages.push({
        messageType: 'user',
        message: option,
        options: [],
        type: '',
        srNo: 0,
        userOption: 0,
      });

      var recordWithOptionsMatch = this.questionResult.find((item: any) =>
        item.options.includes(type)
      );

      const obj = {
        type: recordWithOptionsMatch ? recordWithOptionsMatch.type : '',
        srNo: srNo - 1,
        userOption: 1,
      };
      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.optionsData = response.data;
          this.loading = false;
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.question,
            options: this.optionsData.options,
            type: option,
            srNo: srNo - 1,
            userOption: 0,
          });
        } else if (response.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.message,
            options: [],
            type: option,
            srNo: srNo - 1,
            userOption: 0,
          });
        }
        this.scrollToBottom();
      });
    } else if (option == 'Yes' || option == 'No') {
      
      if (this.messages[1].userOption == 1) {
        if (option == 'Yes') {
          this.messages.push({
            messageType: 'user',
            message: option,
            type: option,
            options: [],
            srNo: 12,
            userOption: 1,
          });
          this.userMessage = this.messages.filter(
            (ele: any) => ele.messageType == 'user'
          );
          const backArray = this.userMessage.filter(
            (item: any) => item.message === 'Back'
          );
          if (backArray.length > 0) {
            this.userMessagesBack = this.userMessage.filter(
              (ele: any) => ele.message != 'Back'
            );
            this.uniqueMessageRecords = this.removeDuplicatesKeepLatest(
              this.userMessagesBack
            );

            if (this.userType == 'Registered') {
              if (this.uniqueMessageRecords.length == 12) {
                const ticketPayload = {
                  emailid: this.uniqueMessageRecords[1].message,
                  mobileno: this.uniqueMessageRecords[3].message,
                  org_name: this.uniqueMessageRecords[4].message,
                  location: this.uniqueMessageRecords[5].message,
                  branch: this.uniqueMessageRecords[6].message,
                  service: this.uniqueMessageRecords[7].message,
                  issue_description: this.uniqueMessageRecords[10].message,
                  sla_id:3,
                  call_type_id:1,
                  status_id:1,
                  call_mode_id:5,
                  priority_id:2,
                  support_group_id:10123,
                  ci_details_id:this.userAssetData.length > 0
                  ? this.userAssetData.filter(
                      (ele: any) =>
                        ele.asset_name ==
                        this.uniqueMessageRecords[9].message
                    )[0].cicd_id
                  : 1081,
                  assignto_id: 1081,
                  logNotes: 'Creating ticket with bot',
                  user_id:this.userData.user_id,
                  loginName: this.userData.user_detailscol7,
                  issueRelatedTo: this.uniqueMessageRecords[8].message,
                };
                this.chatForm.reset();
                this.assetService
                  .createTicketByChatbot(ticketPayload)
                  .subscribe((response: any) => {
                    if (response.message != '') {
                      this.loading = false;
                      this.scrollToBottom();
                      this.messages.push({
                        messageType: 'client',
                        message: response.message,
                        options: this.newConversation,
                        type: '',
                        srNo: 0,
                        userOption: 0,
                      });
                    }
                  });
              }
            }
            if (this.userType == 'Not Registered') {
              if (this.uniqueMessageRecords.length == 12) {
                const ticketPayload = {
                  'issue_description': this.uniqueMessageRecords[10].message,
                  call_mode_id: 5,
                  status_id:1,
                  Category: null,
                  priority_id:2,
                  call_type_id:1,
                  ci_details_id: 1081,
                  sla_id:3,
                  support_group_id: 10123,
                  assignto_id: 1081,
                  logNotes: 'Creating ticket with bot',
                  user_id: this.userData.user_id,
                  loginName: this.userData.user_detailscol7,
                  emailid: this.uniqueMessageRecords[1].message,
                  mobileno: this.uniqueMessageRecords[3].message,
                  branch: this.uniqueMessageRecords[6].message,
                  location: this.uniqueMessageRecords[5].message,
                  org_name: this.uniqueMessageRecords[4].message,
                  service: this.uniqueMessageRecords[7].message,
                  issueRelatedTo: this.uniqueMessageRecords[9].message,
                };

                this.assetService
                  .createTicketByChatbot(ticketPayload)
                  .subscribe((response: any) => {
                    if (response.message != '') {
                      this.loading = false;

                      this.scrollToBottom();
                      this.messages.push({
                        messageType: 'client',
                        message: response.message,
                        options: this.newConversation,
                        type: '',
                        srNo: 0,
                        userOption: 0,
                      });
                    }
                  });
              }
            }
          }

          if (this.userType == 'Registered') {
            if (this.userMessage.length == 12) {
              const ticketPayload = {
                issue_description: this.userMessage[10].message,
                call_mode_id: 5,
                status_id:1,
                Category: null,
                priority_id:2,
                call_type_id: 1,
                sla_id:3,
                ci_details_id:
                  this.userAssetData.length > 0
                    ? this.userAssetData.filter(
                        (ele: any) =>
                          ele.asset_name == this.userMessage[9].message
                      )[0].cicd_id
                    : 1081,
                    support_group_id: 10123,
                assignto_id: 1081,
                logNotes: 'Creating ticket with bot',
                user_id: this.userData.user_id,
                loginName: this.userData.user_detailscol7,
                emailid: this.userMessage[1].message,
                mobileno: this.userMessage[3].message,
                branch: this.userMessage[6].message,
                location: this.userMessage[5].message,
                org_name: this.userMessage[4].message,
                service: this.userMessage[7].message,
                issueRelatedTo: this.userMessage[9].message,
              };
              this.chatForm.reset();
              this.assetService
                .createTicketByChatbot(ticketPayload)
                .subscribe((response: any) => {
                  if (response.message != '') {
                    this.loading = false;
                    this.scrollToBottom();
                    this.messages.push({
                      messageType: 'client',
                      message: response.message,
                      options: this.newConversation,
                      type: '',
                      srNo: 0,
                      userOption: 0,
                    });
                  }
                });
            }
          }
          if (this.userType == 'Not Registered') {
            if (this.userMessage.length == 12) {
              const ticketPayload = {
                issue_description: this.userMessage[10].message,
                call_mode_id: 5,
                status_id:1,
                Category: null,
                priority_id:2,
                call_type_id: 1,
                ci_details_id: 1081,
                sla_id:3,
                support_group_id: 10123,
                assignto_id: 1081,
                logNotes: 'Creating ticket with bot',
                user_id: this.userData.user_id,
                loginName: this.userData.user_detailscol7,
                emailid: this.userMessage[1].message,
                mobileno: this.userMessage[3].message,
                branch: this.userMessage[6].message,
                location: this.userMessage[5].message,
                org_name: this.userMessage[4].message,
                service: this.userMessage[7].message,
                issueRelatedTo: this.userMessage[9].message,
              };

              this.assetService
                .createTicketByChatbot(ticketPayload)
                .subscribe((response: any) => {
                  if (response.message != '') {
                    this.loading = false;
                    this.scrollToBottom();
                    this.messages.push({
                      messageType: 'client',
                      message: response.message,
                      options: this.newConversation,
                      type: '',
                      srNo: 0,
                      userOption: 0,
                    });
                  }
                });
            }
          }
        } else if ('No') {
          this.messages = [];
          this.messages.push({
            messageType: 'user',
            message: option,
            type: option,
            options: [],
            srNo: 12,
            userOption: 1,
          });
          this.messages.push({
            messageType: 'client',
            message: '',
            options: this.newConversation,
            type: '',
            srNo: 0,
            userOption: 0,
          });
          this.scrollToBottom();
        }
      } else if (this.messages[1].userOption == 3) {
        if (option == 'Yes') {
          this.messages.push({
            messageType: 'user',
            message: option,
            type: option,
            options: [],
            srNo: 3,
            userOption: 3,
          });
          const obj = {
            res: 'Yes',
            ticketno: this.ticketNo,
            srNo: 3,
            userOption: 3,
          };
          this.assetService.validateOTP(obj).subscribe((response: any) => {
            if (response.status == 200) {
              this.questionData = response.data;
              this.loading = false;
              this.messages.push({
                messageType: 'client',
                message: this.questionData.message,
                options: this.newConversation,
                type: '',
                srNo: 3,
                userOption: 3,
              });
            } else if (response.data.status == 401) {
              this.messages.push({
                messageType: 'client',
                message: response.data.message,
                options: this.newConversation,
                type: '',
                srNo: 3,
                userOption: 3,
              });
            }
            this.scrollToBottom();
          });
        } else if (option == 'No') {
          this.messages = [];
          this.messages.push({
            messageType: 'user',
            message: option,
            type: option,
            options: this.newConversation,
            srNo: 3,
            userOption: 3,
          });
          this.messages.push({
            messageType: 'client',
            message: '',
            options: this.newConversation,
            type: '',
            srNo: 0,
            userOption: 0,
          });
        }
        this.scrollToBottom();
      }
    } else if (option == 'Start New Conversation') {
      this.messages = [];
      this.messages.push({
        messageType: 'client',
        message: 'Hi,Welcome to ITSM!! Select the option',
        options: this.clientQuestions.map((ele: any) => ele.questionName),
        type: '',
        srNo: 0,
        userOption: 0,
      });
    } else if (this.assetOptions.length != 0) {
      this.messages.push({
        messageType: 'user',
        message: option,
        type: option,
        options: [],
        srNo: 10,
        userOption: 1,
      });
      const obj = {
        type: '',
        srNo: 10,
        userOption: 1,
      };

      this.assetService.sendMessage(obj).subscribe((response: any) => {
        if (response.status == 200) {
          this.optionsData = response.data;
          this.loading = false;
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.question,
            options: [],
            type: '',
            srNo: 10,
            userOption: 0,
          });
        } else if (response.status == 401) {
          this.messages.push({
            messageType: 'client',
            message: this.optionsData.message,
            options: [],
            type: '',
            srNo: 10,
            userOption: 0,
          });
        }
        this.scrollToBottom();
      });
    } else {
      this.messages.push({
        messageType: 'client',
        message: 'Please select option',
        options: [],
        type: '',
        srNo: 0,
        userOption: 0,
      });
    }
  }
  isOptionDisabled(message: any, option: string): boolean {
    // Disable the option if the message has a selected option
    //  if(message.option!==''){
    // return true;
    //  }
    // else
    // {
    //   return false;
    // }
    return false;
  }
  scrollToBottom() {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop =
          this.myScrollContainer.nativeElement.scrollHeight + 500;
      } catch (err) {}
    }, 150);
  }
  removeDuplicatesKeepLatest(records: any[]): any[] {
    // Create a Map to store the latest record for each srNo
    const recordMap = new Map<number, Message>();

    // Iterate over the records
    records.forEach((record) => {
      // Update the Map with the latest record for the srNo
      recordMap.set(record.srNo, record);
    });

    // Convert the Map values to an array
    return Array.from(recordMap.values());
  }
  processNotes(rawNotes: string): string[] {
    return rawNotes
      .split(',')
      .map((note) => note.trim())
      .filter((note) => note.length > 0);
  }
}
