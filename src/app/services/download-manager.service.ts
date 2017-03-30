import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { ErrorService } from './error.service';

import { DownloadManager } from './../models/download-manager';

@Injectable()
export class DownloadManagerService {

  public currentDownloadManager = {};

  private baseUrl: string = 'http://localhost:3000/ngeo';

  private headers = new Headers({ 'Content-Type': 'application/json' });
  private downloadManagersUrl = this.baseUrl + '/downloadManagers';  // URL to web api

  /**
   * @function constructor
   * @param http
   */
  constructor(private http: Http, private _errorService: ErrorService) { }

  /**
   * @function getDownloadManagers
   * @param {string} userId - optional
   */
  // TODO filter on userId
  getDownloadManagers(userId?: string): Observable<DownloadManager[]> {
    return this.http
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
    return this.getDownloadManagers()
      .map(downloadManagers => downloadManagers.find(downloadManager => downloadManager.downloadManagerId === id));
  }

  /**
   * Select download manager to share with other components
   *
   * @param downloadManager
   */
  public select(downloadManager) {
    this.currentDownloadManager = downloadManager;
  }

  /**
   * Get data access requests for the given dat
   * @param downloadManager
   */
  public loadDataAccessRequests() {
    // FIXME: download manager isn't used currently, we retrieve all available requests from LWS
    // TODO: check dlManagerId ...
    return this.http.get(this.baseUrl + '/dataAccessRequestStatuses').map((res) => {
      return res.json();
    })
  }

  /**
   * Register a new download manager
   */
  public registerDownloadManager(username: string, downloadManagerName: string) {
    return this.http.post(this.baseUrl + '/downloadManagers', {
      "downloadmanager": {
        "downloadManagerFriendlyName": downloadManagerName,
        "userId": username,
        "status": "ACTIVE",
        "ipAddress": "localhost",
        "lastAccessDate": Date.now()
      }
    }).map((res) => {
      return res.json();
    })
  }

}
