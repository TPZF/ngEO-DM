
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { NgeoService } from './../../services/ngeo';

@Component({
  selector: 'download-manager',
  template: `
    <h1 class="test">Welcome to {{name}}</h1>
    <md-card color="primary" *ngFor="let feature of features">
      <md-card-title-group>
        <md-card-title style="text-overflow: ellipsis; max-width: 400px; overflow: hidden;">{{feature.properties.identifier}}</md-card-title>
        <md-card-subtitle [innerHtml]="feature.properties.summary['#']"></md-card-subtitle>
        <img md-card-md-image src="{{feature.properties.link[2]['@'].href}}">
    </md-card-title-group>
    </md-card>
    <button md-raised-button color="primary" (click)="retrieveData()">Search</button>
    <md-progress-spinner style="display: inline-block; height: 16px; width: 16px;" *ngIf="isSearching" mode="indeterminate"></md-progress-spinner>
  `,
  styleUrls: ['./download-manager.component.scss']
})
export class DownloadManagerComponent implements OnInit {
  name: string = "ngEO-DM";
  isSearching: boolean = false;
  features: Array<any> = [];
  constructor(private _ngeoService: NgeoService) {
  }

  ngOnInit() {
  }

  retrieveData() {
    this.isSearching = true;
    this._ngeoService.retrieveSomething().subscribe((data) => {
      this.isSearching = false;
      this.features = data.features;
    });
  }
}
