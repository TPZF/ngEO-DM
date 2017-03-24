import { DownloadManagerService } from './../../services/download-manager.service';

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { NgeoService } from './../../services/ngeo';

@Component({
  selector: 'download-manager',
  template: `
    <h1 class="test">Current download manager: {{downloadManagerService.downloadManager.downloadManagerFriendlyName}}</h1>
    <md-card color="primary" *ngFor="let dar of darStatuses">
      <md-card-header>
        <md-card-title style="text-overflow: ellipsis; max-width: 400px; overflow: hidden;">{{dar.ID}}</md-card-title>
        <md-card-subtitle [innerHtml]="dar.type"></md-card-subtitle>
      </md-card-header>
      <md-card-content>
        <div style="max-width: 400px; text-overflow: ellipsis; overflow: hidden; display: block;" *ngFor="let product of dar.productStatuses">
          ProductURL : {{product.productURL}}
          Expected size : {{product.expectedSize}}
          <section class="example-section">
            <md-progress-bar
                color="primary"
                mode="determinate"
                [value]="33"
                bufferValue="75">
            </md-progress-bar>
          </section>
        </div>
      </md-card-content>
    </md-card>
    <button md-raised-button color="primary" (click)="retrieveData()">Search</button>
    <md-progress-spinner style="display: inline-block; height: 16px; width: 16px;" *ngIf="isSearching" mode="indeterminate"></md-progress-spinner>
  `,
  styleUrls: ['./download-manager.component.scss']
})
export class DownloadManagerComponent implements OnInit {

  isSearching: boolean = false;
  darStatuses: Array<any> = [];
  constructor(private downloadManagerService: DownloadManagerService) {
  }

  ngOnInit() {
  }

  retrieveData() {
    this.isSearching = true;
    this.downloadManagerService.loadDataAccessRequests().subscribe((res) => {
      this.isSearching = false;
      this.darStatuses = res.dataAccessRequestStatuses;
    });
  }
}
