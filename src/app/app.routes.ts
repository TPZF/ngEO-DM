import { Routes } from '@angular/router';
// import { HomeComponent } from './components/home/home.component';
// import { LoginComponent } from './components/login/login.component';
import { DownloadManagerComponent } from './components/downloadManager/download-manager.component';

export const routes: Routes = [
  { path: '', component: DownloadManagerComponent },
  { path: 'home', component: DownloadManagerComponent }
  // { path: 'login', component: LoginComponent },
];
