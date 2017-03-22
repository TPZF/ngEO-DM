import { Routes } from '@angular/router';
import { DownloadManagerComponent } from './components/downloadManager/download-manager.component';
import { SearchComponent } from './components/search/search.component';

export const routes: Routes = [
  { path: 'home', component: DownloadManagerComponent },
  { path: 'search', component: SearchComponent }
  // { path: 'login', component: LoginComponent },
];
