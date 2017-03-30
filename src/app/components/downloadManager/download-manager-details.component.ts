// Imports
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';

import { DownloadManagerService } from './../../services/download-manager.service';
import { DownloadManager } from './../../models/download-manager';

@Component({
  selector: 'download-manager-details',
  templateUrl: './download-manager-details.component.html',
  styleUrls: ['./download-manager-details.component.scss']
})
// Component class implementing OnInit
export class DownloadManagerDetailsComponent implements OnInit {
  // Private properties for binding
  private sub: any;
  
  private downloadManager: DownloadManager;

  constructor(private downloadManagerService: DownloadManagerService, private route: ActivatedRoute) {
  }

  // Load data ones component is ready
  ngOnInit() {
      // Subscribe to route params
      this.sub = this.route.params.subscribe(params => {
        let id = params['id'];
       // Retrieve item with Id route param
        this.downloadManagerService.getDownloadManager(id).subscribe(downloadManager => this.downloadManager = downloadManager);
    });
  }

  ngOnDestroy() {
      // Clean sub to avoid memory leak
    this.sub.unsubscribe();
  }
}
