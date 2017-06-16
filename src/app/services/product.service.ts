import { Injectable } from '@angular/core';
import { Response, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { AuthenticationService } from './authentication.service';
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

		let _url = 'https://eodata-service.user.eocloud.eu/eodata/MSI/L1C/2015/07/06/S2A_OPER_PRD_MSIL1C_PDMC_20160607T050846_R051_V20150706T105015_20150706T105015.SAFE/HTML/star_bg.jpg';
		/*
		let _productStatus: ProductStatus = {
			expectedSize: '0',
			percentageCompleted: '0',
			productURL: _url
		};
		let _ressource = '/eodata/MSI/L1C/2015/07/06/S2A_OPER_PRD_MSIL1C_PDMC_20160607T050846_R051_V20150706T105015_20150706T105015.SAFE/HTML/star_bg.jpg';
		this._electronService.ipcRenderer.send('startDownloadRessource', _ressource);
		this._ecpService
			.getProduct(_productStatus)
			.subscribe(
				(response) => {
					_productStatus.percentageCompleted = '100';
					let _newFileName: string = 'star.jpg';
					_productStatus.localPath = this._settingsService.get('downloadPath') + '/' + _newFileName;
					FileSaver.saveAs(response.blob(), _newFileName);
				},
				(error: any) => {
					console.log('ECPService error', error);
				}
			);
		*/
		myDar.productStatuses.forEach((product) => {
			product.percentageCompleted = '0';
			product.loadedSize = '0';
			product.productURL = _url;
		});

		this._electronService.ipcRenderer.send('startECPDownloadDar', myDar);
		/*
		let _i: number = 0;

		myDar.productStatuses.forEach((product) => {
			_i++;
			this.startDownloadProduct(myDar, product, _i);
		});
		*/

	}

	/**
	 *
	 */
	startDownloadProduct(myProduct: ProductStatus) {
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
