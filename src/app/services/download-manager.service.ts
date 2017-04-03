import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { AuthenticationService } from './authentication.service';
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
  constructor(
    private http: Http, 
    private _authenticationService: AuthenticationService,
    private _errorService: ErrorService) { }

  /**
   * @function getDownloadManagers
   */
  getDownloadManagers(): Observable<DownloadManager[]> {
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
    return this.http
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

    return this.http
      .post(this.baseUrl + '/downloadManagers', {downloadmanager: itemToAdd})
      .map((res) => res.json());
  }

}
