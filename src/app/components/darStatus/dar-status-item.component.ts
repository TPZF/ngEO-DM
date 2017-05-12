// Imports
import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ElectronService } from 'ngx-electron';

import { DarStatusService } from './../../services/dar-status.service';
import { ProductService } from './../../services/product.service';
import { DarStatus, ProductStatus } from './../../models/dar-status';

import * as FileSaver from 'file-saver';

@Component({
  selector: 'ngeo-dar-status-item',
  templateUrl: './dar-status-item.component.html',
  styleUrls: ['./dar-status-item.component.scss']
})
// Component class implementing OnInit
export class DarStatusItemComponent implements OnInit, DoCheck {

  @Input() darStatus: DarStatus;

  private _oldStatus: number = 0; // STOP
  private _started: boolean = false;

  constructor(
    private _electronService: ElectronService,
    private darStatusService: DarStatusService,
    private _productService: ProductService
  ) { }

  // Load data ones componet is ready
  ngOnInit() {
    this._oldStatus = this.darStatus.status;
  }

  ngDoCheck() {
    // no management if no product to download
    if (this.darStatus.productStatuses.length === 0) {
      return;
    }
    // set currentPath to save files on hard disk
    if (this.darStatus.downloadDirectory !== '') {
      this._electronService.ipcRenderer.sendSync('setCurrentPath', this.darStatus.downloadDirectory);
    }
    // management of different action buttons
    if (+this._oldStatus === 0 && +this.darStatus.status === 10) {
      // click on start after stop
      this._oldStatus = this._productService.startDownload(this.darStatus);
    } else if (+this._oldStatus === 5 && +this.darStatus.status === 10) {
      // click on start after pause
      this._oldStatus = this._productService.continueDownload(this.darStatus);
    } else if (+this._oldStatus === 5 && +this.darStatus.status === 0) {
      // click on stop after pause
      this._oldStatus = this._productService.stopDownload(this.darStatus);
    } else if (+this._oldStatus === 10 && +this.darStatus.status === 0) {
      // click on stop after start
      this._oldStatus = this._productService.stopDownload(this.darStatus);
    } else if (+this._oldStatus === 10 && +this.darStatus.status === 5) {
      // click on pause after start
      this._oldStatus = this._productService.resumeDownload(this.darStatus);
    } else {
      this._productService.checkDownload(this.darStatus);
    }

  }

  openProductFile(product: ProductStatus) {
    this._electronService.ipcRenderer.send('OpenPath', product.localPath);
  }

}
