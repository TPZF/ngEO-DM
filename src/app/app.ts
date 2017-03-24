
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
import { MaterialModule } from '@angular/material';
import { Md2Module } from 'md2';

/**
 * Services
 */
import { NgeoService } from './services/ngeo';
import { AuthenticationService } from './services/authentication.service';
import { DownloadManagerService } from './services/download-manager.service';

/**
 * Components
 */
import { AppComponent } from './components/app.component';
import { HomeComponent } from './components/home/home.component';
import { DownloadManagerComponent } from './components/downloadManager/download-manager.component';
import { SearchComponent } from './components/search/search.component';
import { LoginComponent } from './components/login/login.component';

import { routes } from './app.routes';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    MaterialModule.forRoot(),
    Md2Module.forRoot(),
    RouterModule.forRoot(routes, { useHash: true })
  ],
  providers: [NgeoService, AuthenticationService, DownloadManagerService],
  declarations: [AppComponent, HomeComponent, SearchComponent, DownloadManagerComponent, LoginComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
platformBrowserDynamic().bootstrapModule(AppModule);
