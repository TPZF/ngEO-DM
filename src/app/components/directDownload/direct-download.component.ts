import { Component, Input, OnInit, NgZone } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { ElectronService } from 'ngx-electron';

import { ConfigurationService } from './../../services/configuration.service';
import { DarStatusService } from './../../services/dar-status.service';
import { ProductService } from './../../services/product.service';
import { SettingsService } from './../../services/settings.service';

import { ProductStatus } from './../../models/dar-status';

@Component({
	selector: 'direct-download',
	templateUrl: './direct-download.component.html',
	styleUrls: ['./direct-download.component.scss']
})
export class DirectDownloadComponent implements OnInit {

	private _fileDownload: ProductStatus;
	private _urlInput: string = 'https://eodata-service.user.eocloud.eu/eodata/MSI/L1C/2015/07/06/S2A_OPER_PRD_MSIL1C_PDMC_20160607T050846_R051_V20150706T105015_20150706T105015.SAFE/HTML/star_bg.jpg';

	constructor(
		private _electronService: ElectronService,
		private _configurationService: ConfigurationService,
		private darStatusService: DarStatusService,
		private _productService: ProductService,
		private _settingsService: SettingsService,
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
		this._electronService.ipcRenderer.on('downloadError', (event, downloadItem) => {
			console.log('downloadError', _that._fileDownload.productURL);
			_that._ngZone.run(() => {
				if (_that._fileDownload.productURL === downloadItem.url) {
					_that._fileDownload.mode = 'determinate';
					_that._fileDownload.errorMsg = JSON.stringify(downloadItem.errorMsg);
				}
			});
		});
		this._electronService.ipcRenderer.on('downloadCompleted', (event, downloadItem) => {
			console.log('downloadCompleted', _that._fileDownload.productURL);
			_that._ngZone.run(() => {
				if (_that._fileDownload.productURL === downloadItem.url) {
					_that._fileDownload.percentageCompleted = '100';
					_that._fileDownload.localPath = downloadItem.path;
				}
			});
		});
		this._electronService.ipcRenderer.on('downloadUpdated', (event, downloadItem) => {
			console.log('downloadUploaded', _that._fileDownload.productURL);
			_that._ngZone.run(() => {
				if (_that._fileDownload.productURL === downloadItem.url) {
					_that._fileDownload.mode = 'determinate';
					_that._fileDownload.percentageCompleted = '' + Math.floor(parseInt(downloadItem.progress) * 100);
					_that._fileDownload.loadedSize = downloadItem.received;
				}
			});
		});

		this._electronService.ipcRenderer.on('downloadFileUpdated', (event, downloadItem) => {
			console.log('downloadFileUpdated');
			_that._ngZone.run(() => {
				if (_that._fileDownload.productURL === downloadItem.url) {
					_that._fileDownload.mode = 'determinate';
					_that._fileDownload.percentageCompleted = '' + Math.floor(parseInt(downloadItem.progress) * 100);
					_that._fileDownload.loadedSize = downloadItem.received;
				}
			});
		});
		this._electronService.ipcRenderer.on('downloadFileCompleted', (event, downloadItem) => {
			console.log('downloadFileCompleted');
			_that._ngZone.run(() => {
				if (_that._fileDownload.productURL === downloadItem.url) {
					_that._fileDownload.mode = 'determinate';
					_that._fileDownload.percentageCompleted = '100';
					_that._fileDownload.localPath = downloadItem.path;
				}
			});
		});
		this._electronService.ipcRenderer.on('downloadFileError', (event, downloadItem) => {
			console.log('downloadFileError');
			_that._ngZone.run(() => {
				if (_that._fileDownload.productURL === downloadItem.url) {
					_that._fileDownload.mode = 'indeterminate';
					_that._fileDownload.percentageCompleted = '0';
					_that._fileDownload.loadedSize = '0';
					_that._productService.startECPDownloadProduct(_that._fileDownload);
				}
			});
		});
	}

	download() {
		this._fileDownload.productURL = this._urlInput;
		this._fileDownload.mode = 'indeterminate';
		if (this._urlInput.indexOf(this._configurationService.get().ecp.serviceprovider.host) > -1) {
			this._productService.startECPDownloadProduct(this._fileDownload);
		} else {
			this._productService.startDownloadFile(this._fileDownload.productURL);
		}
	}

	openProductFile() {
		this._electronService.ipcRenderer.send('OpenPath', this._fileDownload.localPath);
	}

	reset() {
		this._urlInput = 'https://eodata-service.user.eocloud.eu/eodata/MSI/L1C/2015/07/06/S2A_OPER_PRD_MSIL1C_PDMC_20160607T050846_R051_V20150706T105015_20150706T105015.SAFE/HTML/star_bg.jpg';
		this._fileDownload.loadedSize = '0';
		this._fileDownload.errorMsg = '';
		this._fileDownload.percentageCompleted = '0';
	}

	private isValidForm() {
		return (this._urlInput);
	}

}
