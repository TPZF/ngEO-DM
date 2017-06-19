import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { AuthenticationService } from './authentication.service';
import { ConfigurationService } from './configuration.service';
import { ErrorService } from './error.service';

import { DownloadManager } from './../models/download-manager';

@Injectable()
export class DownloadManagerService {

	public currentDownloadManager = {};

	private baseUrl: string;
	private downloadManagersUrl: string;

	private headers = new Headers({ 'Content-Type': 'application/json' });

	/**
	 * @function constructor
	 * @param http
	 */
	constructor(
		private _http: Http,
		private _authenticationService: AuthenticationService,
		private _configurationService: ConfigurationService,
		private _errorService: ErrorService) {
		this.baseUrl = _configurationService.get().qsHost;
		this.downloadManagersUrl = this.baseUrl + '/downloadManagers';
	}

	/**
	 * @function getDownloadManagers
	 */
	getDownloadManagers(): Observable<DownloadManager[]> {
		return this._http
			.get(this.downloadManagersUrl)
			.map((response) => {
				return response.json().downloadmanagers;
			})
			.catch(this._errorService.handleError);
	}

	/**
	 * @function getDownloadManager
	 * @param id
	 */
	getDownloadManager(id: string): Observable<DownloadManager> {
		return this._http
			.get(`${this.downloadManagersUrl}/${id}`)
			.map(response => response.json().downloadmanager)
			.catch(this._errorService.handleError);
	}

	/**
	 * Register a new download manager
	 */
	public registerDownloadManager(downloadManagerInsert: any) {

		let userId = this._authenticationService.getCurrentUser().username;

		let itemToAdd: DownloadManager = {
			downloadManagerFriendlyName: downloadManagerInsert.downloadManagerFriendlyName,
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
