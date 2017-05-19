// Imports
import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ElectronService } from 'ngx-electron';

import { DarStatusService } from './../../services/dar-status.service';
import { ProductService } from './../../services/product.service';
import { SettingsService } from './../../services/settings.service';

import { DarStatus, ProductStatus } from './../../models/dar-status';

import * as FileSaver from 'file-saver';

@Component({
	selector: 'ngeo-product-status-item',
	templateUrl: './product-status-item.component.html',
	styleUrls: ['./product-status-item.component.scss']
})
// Component class implementing OnInit
export class ProductStatusItemComponent implements OnInit, DoCheck {

	@Input() productStatus: ProductStatus;

	private _newStatus: string = '0'; // STOP
	private _started: boolean = false;

	constructor(
		private _electronService: ElectronService,
		private darStatusService: DarStatusService,
		private _productService: ProductService,
		private _settingsService: SettingsService
	) { }

	// Load data ones componet is ready
	ngOnInit() {
		let _that = this;
		this._electronService.ipcRenderer.on('downloadCompleted', (event, downloadItem) => {
			if (this.productStatus.productURL === downloadItem.url) {
				this.productStatus.percentageCompleted = '100';
				this.productStatus.localPath = downloadItem.path;
			}
		});
		this._electronService.ipcRenderer.on('downloadUpdated', (event, downloadItem) => {
			if (this.productStatus.productURL === downloadItem.url) {
				this.productStatus.percentageCompleted = '' + Math.floor(parseInt(downloadItem.progress) * 100);
				this.productStatus.loadedSize = downloadItem.received;
			}
		});
	}

	ngDoCheck() {

	}

	openProductFile() {
		this._electronService.ipcRenderer.send('OpenPath', this.productStatus.localPath);
	}

}
