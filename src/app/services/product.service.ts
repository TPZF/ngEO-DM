import { Injectable } from '@angular/core';
import { Response, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { AuthenticationService } from './authentication.service';
import { ConfigurationService } from './configuration.service';
import { ErrorService } from './error.service';
import { ElectronService } from 'ngx-electron';
import { SettingsService } from './settings.service';
//import { SsoService } from './sso.service';
//import { ECPService } from './ecp.service';

import { DarStatus } from '../models/dar-status';
import { ProductStatus } from '../models/dar-status';

//import * as FileSaver from 'file-saver';

@Injectable()
export class ProductService {

	/**
	 * @function constructor
	 */
	constructor(
		//private _http: ProgressHttp,
		private _authenticationService: AuthenticationService,
		private _configurationService: ConfigurationService,
		//private _ecpService: ECPService,
		private _electronService: ElectronService,
		private _settingsService: SettingsService,
		//private _ssoService: SsoService,
		private _errorService: ErrorService) { }

	/**
	 * @function startDownload
	 * @param myDar
	 */
	startDownload(myDar: DarStatus) {

		myDar.productStatuses.forEach((_product) => {
			_product.percentageCompleted = '0';
			_product.loadedSize = '0';
			_product.mode = 'indeterminate';
			if (_product.productURL.indexOf(this._configurationService.get().ecp.serviceprovider.host) > -1) {
				this.startECPDownloadProduct(_product);
			} else {
				this.startDownloadFile(_product.productURL);
			}
		});

	}

	/**
	 *
	 */
	startDownloadFile(myUrl: String) {
		this._electronService.ipcRenderer.send('startDownloadFile', myUrl);
	}

	/**
	 *
	 */
	startECPDownloadProduct(myProduct: ProductStatus) {
		this._electronService.ipcRenderer.send('startECPDownloadDar', { productStatuses: [myProduct] });
	}

	/**
	 * @function startDownloadProduct
	 * @param myDar
	 * @param myProduct
	 * @param myIndice
	 */
	startDownloadProduct2(myDar: DarStatus, myProduct: ProductStatus, myIndice: number) {

		this._electronService.ipcRenderer.send('downloadFile', myProduct.productURL);
		/*
		this._ssoService
			.getProduct(myProduct)
			.subscribe(
				(response) => {
				console.log('startDownloadProduct', response);
				myProduct.percentageCompleted = '100';
				let _newFileName: string = myDar.ID + '-file-' + myIndice + '.zip';
				myProduct.localPath = this._settingsService.get('downloadPath') + '/' + _newFileName;
				FileSaver.saveAs(response.blob(), _newFileName);
			},
			(error: any) => {
				this.stopDownload(myDar);
				myProduct.errorMsg = error.statusText;
				console.log('startDownloadProduct', error);
			}
			);
		*/
		/*this._http
			.withDownloadProgressListener(progress => { myProduct.percentageCompleted = '' + progress.percentage; })
			.get(myProduct.productURL, { responseType: ResponseContentType.Blob })
			.subscribe((response) => {
				myProduct.percentageCompleted = '100';
				let _newFileName: string = myDar.ID + '-file-' + myIndice + '.zip';
				FileSaver.saveAs(response.blob(), _newFileName);
				myProduct.localPath = myDar.downloadDirectory + _newFileName;
			});*/
	}

	cancelDownload(myDar: DarStatus) {
		this._electronService.ipcRenderer.send('cancelDownloadDar', myDar);
	}

	pauseDownload(myDar: DarStatus) {
		this._electronService.ipcRenderer.send('pauseDownloadDar', myDar);
	}

	checkDownload(myDar: DarStatus, myStatus: string) {

		let complete = 0;
		myDar.productStatuses.forEach((product) => {
			if (+product.percentageCompleted === 100) {
				complete++;
			}
		});
		if (complete === myDar.productStatuses.length) {
			myDar.status = 0;
			return '0';
		} else {
			return myStatus;
		}
	}


}
