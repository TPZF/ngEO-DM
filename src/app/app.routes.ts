import { Routes } from '@angular/router';
import { DownloadManagerComponent } from './components/downloadManager/download-manager.component';

export const routes: Routes = [
  { path: '', component: DownloadManagerComponent },
  { path: 'home', component: DownloadManagerComponent }
  // { path: 'login', component: LoginComponent },
];
