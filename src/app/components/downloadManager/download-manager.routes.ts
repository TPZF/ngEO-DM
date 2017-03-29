import { Routes } from '@angular/router';

import { DownloadManagerListComponent }    from './download-manager-list.component';
import { DownloadManagerDetailsComponent }    from './download-manager-details.component';

// Route Configuration
export const downloadManagerRoutes: Routes = [
  { path: 'downloadManagers', component: DownloadManagerListComponent },
  { path: 'downloadManagers/:id', component: DownloadManagerDetailsComponent }
];
