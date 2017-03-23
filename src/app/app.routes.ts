import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DownloadManagerComponent } from './components/downloadManager/download-manager.component';
import { SearchComponent } from './components/search/search.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: DownloadManagerComponent },
  { path: 'search', component: SearchComponent }
];
