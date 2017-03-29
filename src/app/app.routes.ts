import { ModuleWithProviders }  from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { SearchComponent } from './components/search/search.component';
import { downloadManagerRoutes } from './components/downloadManager/download-manager.routes';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'search', component: SearchComponent },
  ...downloadManagerRoutes
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
