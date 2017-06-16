import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingsComponent } from './components/settings/settings.component';
import { SearchComponent } from './components/search/search.component';
import { DirectDownloadComponent } from './components/directDownload/direct-download.component';
import { downloadManagerRoutes } from './components/downloadManager/download-manager.routes';

export const routes: Routes = [
	{ path: '', redirectTo: '/settings', pathMatch: 'full' },
	{ path: 'settings', component: SettingsComponent },
	{ path: 'search', component: SearchComponent },
	{ path: 'directDownload', component: DirectDownloadComponent },
	...downloadManagerRoutes
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
