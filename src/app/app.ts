
/*
 * Angular Modules
 */
import { enableProdMode, NgModule, Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { ProgressHttpModule } from 'angular-progress-http';
import { NgxElectronModule } from 'ngx-electron';
/**
 * Material design
 */
import { MaterialModule } from '@angular/material';
import { Md2Module } from 'md2';

/**
 * Services
 */
import { NgeoService } from './services/ngeo.service';
import { AuthenticationService } from './services/authentication.service';
import { DarStatusService } from './services/dar-status.service';
import { DownloadManagerService } from './services/download-manager.service';
import { ErrorService } from './services/error.service';
import { ProductService } from './services/product.service';

/**
 * Components
 */
import { AppComponent } from './components/app.component';
import { DarStatusListComponent } from './components/darStatus/dar-status-list.component';
import { DarStatusItemComponent } from './components/darStatus/dar-status-item.component';

import { DownloadManagerDetailsComponent } from './components/downloadManager/download-manager-details.component';
import { DownloadManagerListComponent } from './components/downloadManager/download-manager-list.component';
import { LoginComponent } from './components/login/login.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchComponent } from './components/search/search.component';

/**
 * Pipes
 */
import { FileSizePipe } from './pipes/file-size.pipe';

/**
 * Routes
 */
import { routes } from './app.routes';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    MaterialModule.forRoot(),
    Md2Module.forRoot(),
    NgxElectronModule,
    ProgressHttpModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes, { useHash: true })
  ],
  providers: [
    NgeoService,
    AuthenticationService,
    DarStatusService,
    DownloadManagerService,
    ErrorService,
    ProductService
  ],
  declarations: [
    AppComponent,
    DarStatusListComponent,
    DarStatusItemComponent,
    DownloadManagerDetailsComponent,
    DownloadManagerListComponent,
    FileSizePipe,
    LoginComponent,
    NavbarComponent,
    SearchComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
platformBrowserDynamic().bootstrapModule(AppModule);
