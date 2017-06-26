// Imports
import { Component, OnInit, Input } from '@angular/core';

import { ElectronService } from 'ngx-electron';

import { ProductStatus } from './../../models/dar-status';

@Component({
	selector: 'ngeo-product-status-item',
	templateUrl: './product-status-item.component.html',
	styleUrls: ['./product-status-item.component.scss']
})
// Component class implementing OnInit
export class ProductStatusItemComponent implements OnInit {

	@Input() productStatus: ProductStatus;

	constructor(
		private _electronService: ElectronService
	) { }

	// Load data ones component is ready
	ngOnInit() {
		this.productStatus.mode = 'determinate';
	}

	openProductFile() {
		this._electronService.ipcRenderer.send('OpenPath', this.productStatus.localPath);
	}

}
