import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

// SERVICES
import { ConfigurationService } from './configuration.service';
import { ElectronService } from 'ngx-electron';
import { ErrorService } from './error.service';
import { SettingsService } from './settings.service';

// MODELS
import { DownloadManager } from './../models/download-manager';

@Injectable()
export class DownloadManagerService {

	public currentDownloadManager = {};

	private _numberOfConnection: number = 0;

	private baseUrl: string;
	private downloadManagersUrl: string;

	private headers = new Headers({ 'Content-Type': 'application/json' });

	/**
	 * @function constructor
	 * @param http
	 */
	constructor(
		private _http: Http,
		private _configurationService: ConfigurationService,
		private _electronService: ElectronService,
		private _settingsService: SettingsService,
		private _errorService: ErrorService
	) {
		this.baseUrl = _configurationService.get().qsHost;
		this.downloadManagersUrl = this.baseUrl + '/downloadManagers';
	}

	/**
	 * @function getDownloadManagers
	 */
	getDownloadManagers(): Observable<DownloadManager[]> {
		let _that = this;
		return this._http
			.get(this.downloadManagersUrl)
			.map((response) => {
				return response.json().downloadmanagers;
			})
			.catch((err: any, caught: Observable<any>) => {
				if (err.status === 401 && _that._numberOfConnection < 5) {
					_that._numberOfConnection++;
					//_that._authenticationService.login();
					_that._electronService.ipcRenderer.send('login');
				}
				return Observable.throw(err);
			});
	}

	/**
	 * @function getDownloadManager
	 * @param id
	 */
	getDownloadManager(myId: string): Observable<DownloadManager> {
		return this._http
			.get(`${this.downloadManagersUrl}/${myId}`)
			.map(response => response.json().downloadmanager)
			.catch(this._errorService.handleError);
	}

	/**
	 * Register a new download manager
	 */
	public registerDownloadManager(myDownloadManagerFriendlyNameInsert: string) {

		let userId = this._settingsService.get('username');

		let itemToAdd: DownloadManager = {
			downloadManagerFriendlyName: myDownloadManagerFriendlyNameInsert,
			userId: userId,
			status: 'ACTIVE',
			ipAddress: 'localhost',
			lastAccessDate: Date.now().toString()
		};

		return this._http
			.post(this.downloadManagersUrl, { downloadmanager: itemToAdd })
			.map((res) => res.json());
	}

	deleteOne(myId: string): Observable<Boolean> {
		return this._http
			.delete(`${this.downloadManagersUrl}/${myId}`)
			.map(response => {
				return true;
			})
			.catch(this._errorService.handleError);
	}

}
