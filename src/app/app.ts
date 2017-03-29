
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
import { DownloadManagerService } from './services/download-manager.service';

/**
 * Components
 */
import { AppComponent } from './components/app.component';
import { LoginComponent } from './components/login/login.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchComponent } from './components/search/search.component';

import { routes } from './app.routes';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    MaterialModule.forRoot(),
    Md2Module.forRoot(),
    ReactiveFormsModule,
    RouterModule.forRoot(routes, { useHash: true })
  ],
  providers: [
    NgeoService, 
    AuthenticationService, 
    DownloadManagerService
  ],
  declarations: [
    AppComponent, 
    LoginComponent,
    NavbarComponent, 
    SearchComponent 
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
platformBrowserDynamic().bootstrapModule(AppModule);
