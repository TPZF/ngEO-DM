// Imports
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { DownloadManagerService } from './../../services/download-manager.service';
import { DownloadManager } from './../../models/download-manager';

@Component({
  selector: 'download-manager-list',
  templateUrl: './download-manager-list.component.html',
  styleUrls: ['./download-manager-list.component.scss']
})
// Component class implementing OnInit
export class DownloadManagerListComponent implements OnInit {
  
  // Private property for binding
  private errorMessage: string;
  private downloadManagers: DownloadManager[];

  constructor(private downloadManagerService: DownloadManagerService) { }

  // Load data ones componet is ready
  ngOnInit() {
    // Pass retreived downloadManagers to the property
    this.downloadManagerService
    .getDownloadManagers()
    .subscribe(
      downloadManagers => this.downloadManagers = downloadManagers,
      error => this.errorMessage = <any>error
    );
  }

  isActive(myDownloadManager) {
    return myDownloadManager.status === 'ACTIVE';
  }
}
