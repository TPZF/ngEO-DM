
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
import { ConfigurationService } from './services/configuration.service';
import { DarStatusService } from './services/dar-status.service';
import { DownloadManagerService } from './services/download-manager.service';
import { ECPService } from './services/ecp.service';
import { ErrorService } from './services/error.service';
import { IpcRendererService } from './services/ipc-renderer.service';
import { ProductService } from './services/product.service';
import { SettingsService } from './services/settings.service';

/**
 * Components
 */
import { AppComponent } from './components/app.component';
import { DarStatusListComponent } from './components/darStatus/dar-status-list.component';
import { DarStatusItemComponent } from './components/darStatus/dar-status-item.component';
import { DarStatusAddComponent } from './components/darStatus/dar-status-add.component';
import { ProductStatusItemComponent } from './components/darStatus/product-status-item.component';
import { DownloadManagerDetailsComponent } from './components/downloadManager/download-manager-details.component';
import { DownloadManagerListComponent } from './components/downloadManager/download-manager-list.component';
import { SettingsComponent } from './components/settings/settings.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchComponent } from './components/search/search.component';
import { DirectDownloadComponent } from './components/directDownload/direct-download.component';

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
		ReactiveFormsModule,
		RouterModule.forRoot(routes, { useHash: true })
	],
	providers: [
		NgeoService,
		AuthenticationService,
		ConfigurationService,
		DarStatusService,
		DownloadManagerService,
		ECPService,
		ErrorService,
		IpcRendererService,
		ProductService,
		SettingsService
	],
	declarations: [
		AppComponent,
		DarStatusListComponent,
		DarStatusItemComponent,
		DarStatusAddComponent,
		DirectDownloadComponent,
		DownloadManagerDetailsComponent,
		DownloadManagerListComponent,
		FileSizePipe,
		SettingsComponent,
		NavbarComponent,
		ProductStatusItemComponent,
		SearchComponent
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
const isDev = process.env.TODO_DEV ? process.env.TODO_DEV.trim() == 'true' : false;
if (!isDev) {
	enableProdMode();
}
platformBrowserDynamic().bootstrapModule(AppModule);
