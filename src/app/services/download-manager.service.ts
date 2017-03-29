import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

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
  constructor(private http: Http) { }

  /**
   * @function getDownloadManagers
   */
  getDownloadManagers(): Observable<DownloadManager[]> {
    return this.http
    .get(this.downloadManagersUrl)
    .map((response) => {
      return response.json().downloadmanagers;
    })
    .catch(this._handleError);
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

  /**
   * Get registered download managers for the given user
   * @param username
   */
  public getDownloadManagers2(username: string) {
    return this.http.get(this.baseUrl + '/downloadManagers').map((res) => {
      return res.json();
    });
  }
  /**
   * @function handleError
   * @param error 
   */
  private _handleError(error: Response | any) {
    // In a real world app, you might use a remote logging infrastructure
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return Observable.throw(errMsg);
  }

}
