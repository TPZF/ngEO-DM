// Imports
import { Component, OnInit, Input, DoCheck, NgZone } from '@angular/core';
import { ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ElectronService } from 'ngx-electron';

import { DarStatusService } from './../../services/dar-status.service';
import { ProductService } from './../../services/product.service';
import { SettingsService } from './../../services/settings.service';

import { DarStatus } from './../../models/dar-status';
import { ProductStatus } from './../../models/dar-status';

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
		private _settingsService: SettingsService,
		private _ngZone: NgZone
	) { }

	// Load data ones component is ready
	ngOnInit() {
		let _that = this;
		this.productStatus.mode = 'determinate';
	}

	ngDoCheck() {

	}

	openProductFile() {
		this._electronService.ipcRenderer.send('OpenPath', this.productStatus.localPath);
	}

}
