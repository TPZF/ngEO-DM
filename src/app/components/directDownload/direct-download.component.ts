import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';

import { ElectronService } from 'ngx-electron';
import { IpcRendererService } from './../../services/ipc-renderer.service';

import { ProductStatus } from './../../models/dar-status';

@Component({
	selector: 'direct-download',
	templateUrl: './direct-download.component.html',
	styleUrls: ['./direct-download.component.scss']
})
export class DirectDownloadComponent implements OnDestroy, OnInit {

	private _fileDownload: ProductStatus;
	private _urlInput: string = 'https://eodata-service.user.eocloud.eu/eodata/MSI/L1C/2015/07/06/S2A_OPER_PRD_MSIL1C_PDMC_20160607T050846_R051_V20150706T105015_20150706T105015.SAFE/HTML/star_bg.jpg';

	constructor(
		private _electronService: ElectronService,
		private _ipcRendererService: IpcRendererService,
		private _ngZone: NgZone
	) { }

	ngOnInit() {
		let _that = this;
		this._fileDownload = {
			percentageCompleted: '0',
			expectedSize: '0',
			mode: 'determinate',
			productURL: ''
		};
		this._ipcRendererService.initDownload(this._ngZone, this._fileDownload);
	}

	download() {
		this._fileDownload.productURL = this._urlInput;
		this._fileDownload.mode = 'indeterminate';
		this._electronService.ipcRenderer.send('startDownload', this._fileDownload.productURL, 'direct');
	}

	openProductFile() {
		this._electronService.ipcRenderer.send('OpenPath', this._fileDownload.localPath);
	}

	reset() {
		this._urlInput = 'https://eodata-service.user.eocloud.eu/eodata/MSI/L1C/2015/07/06/S2A_OPER_PRD_MSIL1C_PDMC_20160607T050846_R051_V20150706T105015_20150706T105015.SAFE/HTML/star_bg.jpg';
		this._fileDownload.loadedSize = '0';
		this._fileDownload.errorMsg = '';
		this._fileDownload.percentageCompleted = '0';
		this._fileDownload.mode = 'determinate';
	}

	ngOnDestroy() {
		this._ipcRendererService.destroyDownload();
	}

	private isValidForm() {
		return (this._urlInput);
	}

	private _setDownloadUpdate() {

	}

}
