// CORE
import { Injectable } from '@angular/core';
import { Headers, RequestOptions, Response, ResponseContentType, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/timeout';

import { ProgressHttp } from 'angular-progress-http';

// MODELS
import { ProductStatus } from '../models/dar-status';

// SERVICES
import { SettingsService } from './settings.service';


@Injectable()
export class EoSsoService {

	constructor(
		private _progressHttp: ProgressHttp,
		private _settingsService: SettingsService
	) {	}

	/**
	 * @function getProductUrl
	 * @param myProductUrl
	 */
	getProduct(myProduct: ProductStatus, myServiceProviderUrl: string): Observable<Response> {

		// url
		let _serviceProviderUrl = myServiceProviderUrl.replace(/adapter/, 'login');

		// headers
		let _headers = new Headers();
		_headers.append('Content-Type', 'application/x-www-form-urlencoded');
		let _options = new RequestOptions({ headers: _headers, responseType: ResponseContentType.Blob });

		// body
		let _urlSearchParams = new URLSearchParams();
		_urlSearchParams.append('cn', this._settingsService.get('username'));
		_urlSearchParams.append('password', this._settingsService.get('password'));
		_urlSearchParams.append('idleTime', 'oneday');
		_urlSearchParams.append('sessionTime', 'oneday');
		_urlSearchParams.append('loginFields', 'cn@password');
		_urlSearchParams.append('loginMethod', 'umsso');
		let _body = _urlSearchParams.toString();

		// make http request
		return this._progressHttp
			.withDownloadProgressListener(progress => {
				myProduct.percentageCompleted = '' + progress.percentage;
			})
			.post(_serviceProviderUrl, _body, _options);
	}

}
