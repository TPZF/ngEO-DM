import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class NgeoService {
  private baseUrl: string = 'http://localhost:3000/ngeo'
  constructor(private _http: Http) {
  }

  /**
   * Just a simple search request
   */
  public retrieveSomething() {
    return this._http.get(this.baseUrl + '/catalogue/Landsat57Merged/search').map((res) => {
      return res.json()
    });
  }

  /**
   * Register a new download manager
   */
  public registerDownloadManager(username: string, downloadManagerName: string) {
    return this._http.post(this.baseUrl + '/downloadManagers', {
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
  public getDownloadManagers(username: string) {
    return this._http.get(this.baseUrl + '/downloadManagers').map((res) => {
      return res.json();
    });
  }
}
