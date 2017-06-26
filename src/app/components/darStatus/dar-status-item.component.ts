// Imports
import { Component, OnDestroy, OnInit, Input, DoCheck, NgZone } from '@angular/core';
import { ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ElectronService } from 'ngx-electron';

import { DarStatusService } from './../../services/dar-status.service';
import { IpcRendererService } from './../../services/ipc-renderer.service';

import { DarStatus, ProductStatus } from './../../models/dar-status';

import * as FileSaver from 'file-saver';

@Component({
	selector: 'ngeo-dar-status-item',
	templateUrl: './dar-status-item.component.html',
	styleUrls: ['./dar-status-item.component.scss']
})
// Component class implementing OnInit
export class DarStatusItemComponent implements OnDestroy, OnInit, DoCheck {

	@Input() darStatus: DarStatus;

	private _newStatus: string = '0'; // STOP
	private _started: boolean = false;

	constructor(
		private _darStatusService: DarStatusService,
		private _electronService: ElectronService,
		private _ipcRendererService: IpcRendererService,
		private _ngZone: NgZone
	) { }

	// Load data ones component is ready
	ngOnInit() {
		let _that = this;
		this._newStatus = '' + this.darStatus.status;

		this._ipcRendererService.initDownloadForDarStatus(this._ngZone, this.darStatus);

	}

	ngDoCheck() {
		// no management if no product to download
		if (this.darStatus.productStatuses.length === 0) {
			return;
		}
		// management of different action buttons
		if (+this._newStatus === 0 && +this.darStatus.status === 10) {
			// click on stop after start
			this.darStatus.status = 0;
			this._darStatusService.cancelDownload(this.darStatus);
		} else if (+this._newStatus === 5 && +this.darStatus.status === 10) {
			// click on pause after start
			this.darStatus.status = 5;
			this._darStatusService.pauseDownload(this.darStatus);
		} else if (+this._newStatus === 0 && +this.darStatus.status === 5) {
			// click on stop after pause
			this.darStatus.status = 0;
			this._darStatusService.cancelDownload(this.darStatus);
		} else if (+this._newStatus === 10 && +this.darStatus.status === 0) {
			// click on start after stop
			this.darStatus.status = 10;
			this._darStatusService.startDownload(this.darStatus);
		} else if (+this._newStatus === 10 && +this.darStatus.status === 5) {
			// click on start after pause
			this.darStatus.status = 10;
			this._darStatusService.startDownload(this.darStatus);
		} else {
			this._newStatus = this._darStatusService.checkDownload(this.darStatus, this._newStatus);
		}

	}

	openProductFile(product: ProductStatus) {
		this._electronService.ipcRenderer.send('OpenPath', product.localPath);
	}

	ngOnDestroy() {
		this._ipcRendererService.destroyDownload();
	}

	delete() {
		this._darStatusService.deleteOne(this.darStatus.ID);
	}

}
