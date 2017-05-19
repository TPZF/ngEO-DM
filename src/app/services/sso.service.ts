import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions, Response, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';

import { URL } from 'url';

import { ProgressHttp } from 'angular-progress-http';

import { ProductStatus } from '../models/dar-status';
import { ECPService } from './ecp.service';
import { EoSsoService } from './eo-sso.service';

@Injectable()
export class SsoService {

	constructor(
		private _http: Http,
		private _progressHttp: ProgressHttp,
		private _ecpService: ECPService,
		private _eoSsoService: EoSsoService 
	) {	}

	/**
	 * @function getProduct
	 * @param myProduct
	 */
	getProduct(myProduct: ProductStatus): Observable<Response> {

		// for test >> force url to use ECP service
		// myProductUrl = 'https://eodata-service.user.eocloud.eu/eodata/MSI/L1C/2015/07/06/S2A_OPER_PRD_MSIL1C_PDMC_20160607T050846_R051_V20150706T105015_20150706T105015.SAFE/HTML/star_bg.jpg';

		return this._progressHttp
			.withDownloadProgressListener(progress => {
				myProduct.percentageCompleted = '' + progress.percentage;
				myProduct.loadedSize = '' + progress.loaded;
			})
			.get(myProduct.productURL, {responseType: ResponseContentType.Blob})
			.map((response: Response) => {
				let contentLength = parseInt(response.headers.get('content-length'));
				if (contentLength < 1e6) {
					return this._eoSsoService.getProduct(myProduct, response.url);
				}
				return response;
			})
		;
	}

}
