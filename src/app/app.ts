import { SearchComponent } from './components/search/search.component';
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

/**
 * Services
 */
import { NgeoService } from './services/ngeo';
/**
 * Components
 */
import { AppComponent } from './components/app.component';
import { DownloadManagerComponent } from './components/downloadManager/download-manager.component';

import { routes } from './app.routes';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    MaterialModule.forRoot(),
    RouterModule.forRoot(routes, { useHash: true })
  ],
  providers: [NgeoService],
  declarations: [AppComponent, DownloadManagerComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
platformBrowserDynamic().bootstrapModule(AppModule);
