import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';

import { ConfigurationService } from './configuration.service';
import { ErrorService } from './error.service';
import { ElectronService } from 'ngx-electron';
import { DarStatus, ProductStatus } from './../models/dar-status';

@Injectable()
export class DarStatusService {

	public darStatuses: Observable<DarStatus[]>;
	private _darStatuses: BehaviorSubject<DarStatus[]>;
	private _dataStore: {
		darStatuses: DarStatus[]
	};

	private _headers = new Headers({ 'Content-Type': 'application/json' });
	private _baseUrl: string;
	private _darStatusesUrl: string;
	private _simpleDarUrl: string;

	/**
	 * @function constructor
	 * @param http
	 */
	constructor(
		private _http: Http,
		private errorService: ErrorService,
		private _configurationService: ConfigurationService,
		private _electronService: ElectronService
	) {
		this._baseUrl = _configurationService.get().qsHost;
		this._darStatusesUrl = this._baseUrl + '/dataAccessRequestStatuses';
		this._simpleDarUrl = this._baseUrl + '/simpleDataAccessRequests';
		this._dataStore = { darStatuses: [] };
		this._darStatuses = <BehaviorSubject<DarStatus[]>>new BehaviorSubject([]);
		this.darStatuses = this._darStatuses.asObservable();
	}

	/**
	 * @function getDarStatuses
	 * @param {string} downloadManagerId
	 */
	getDarStatuses(downloadManagerId: string) {
		this._http
			.get(this._darStatusesUrl)
			.map(response => {
				return response.json().dataAccessRequestStatuses;
			})
			.subscribe(data => {
				this._dataStore.darStatuses = [];
				data.forEach((item, index) => {
					if (item.dlManagerId === downloadManagerId) {
						this._dataStore.darStatuses.push(item);
					}
				});
				this._darStatuses.next(Object.assign({}, this._dataStore).darStatuses);
			}, error => {
				console.log('Could not load darStatuses');
			});
	}

	addSimpleDAR(myDar: any) {
		this._http
			.put(this._simpleDarUrl, myDar)
			.map(_response => _response.json().dataAccessRequestStatus)
			.subscribe(
			_dar => {
				this._dataStore.darStatuses.push(_dar);
				this._darStatuses.next(Object.assign({}, this._dataStore).darStatuses);
			},
			_error => { }
			);
	}

	deleteOne(myDarId: string): void {
		this._http
			.delete(this._darStatusesUrl + '/' + myDarId)
			.subscribe(
			_resp => {
				let newStore = [];
				this._dataStore.darStatuses.forEach((item) => {
					if (item.ID !== myDarId) {
						newStore.push(item);
					}
				});
				this._dataStore.darStatuses = newStore;
				this._darStatuses.next(Object.assign({}, this._dataStore).darStatuses);
			},
			_error => {

			}
			);
	}

	/**
	 * @function startDownload
	 * @param {DarStatus} myDar
	 * @see component <dar-status-item>
	 */
	startDownload(myDar: DarStatus) {
		let _darName = myDar.name ? myDar.name : myDar.ID;
		myDar.productStatuses.forEach((_product) => {
			_product.percentageCompleted = '0';
			_product.loadedSize = '0';
			_product.mode = 'indeterminate';
			this._electronService.ipcRenderer.send('startDownload', _product.productURL, _darName);
		});
	}

	/**
	 * @function stopDownload
	 * @param {DarStatus} myDar
	 * @see component <dar-status-item>
	 */
	stopDownload(myDar: DarStatus) {
		let _darName = myDar.name ? myDar.name : myDar.ID;
		myDar.productStatuses.forEach((_product) => {
			if (+_product.percentageCompleted < 100) {
				this._electronService.ipcRenderer.send('stopDownload', _product.productURL, _darName);
			}
		});
	}

	/**
	 * @function cleanDownload
	 * @param {DarStatus} myDar
	 * @see component <dar-status-item>
	 */
	cleanDownload(myDar: DarStatus) {
		let _darName = myDar.name ? myDar.name : myDar.ID;
		myDar.productStatuses.forEach((_product) => {
			if (+_product.percentageCompleted < 100) {
				this._electronService.ipcRenderer.send('cleanDownload', _product.productURL, _darName);
			}
		});
	}

	/**
	 * @function checkDownload
	 * @param {DarStatus} myDar
	 * @param {string} myStatus
	 * @see component <dar-status-item>
	 */
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

	// /**
	//  * @function getDarStatus
	//  * @param id
	//  */
	// getDarStatus(id: string): Observable<DarStatus> {
	//   return this.http
	//   .get(this.darStatusesUrl + '/' + id)
	//   .map((response) => {
	//     return response.json().darStatus;
	//   })
	//   .catch(this.errorService.handleError);
	// }


}
