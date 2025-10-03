import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthComponent } from './layouts/auth/auth.component';
import { AdminComponent } from './layouts/admin/admin.component';
import { HeaderComponent } from './layouts/header/header.component';
import { SidebarComponent } from './layouts/sidebar/sidebar.component';
import { PrimengModule } from './primeng/primeng.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthoriseInterceptor } from './helpers/authorise.interceptor';
import { CardModule } from 'primeng/card';
import { PageNotFoundComponent } from './layouts/page-not-found/page-not-found.component';
import { ClipboardModule } from '@angular/cdk/clipboard';




@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    AdminComponent,
    HeaderComponent,
    SidebarComponent,
    PageNotFoundComponent,
    
    
    
    
    // DynamicTableComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    PrimengModule,
    HttpClientModule,
    CardModule,
    ClipboardModule

  ],
  providers: [MessageService,ConfirmationService,{
    provide:HTTP_INTERCEPTORS,
    useClass: AuthoriseInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
