import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class DownloadManagerService {
  private baseUrl: string = 'http://localhost:3000/ngeo'
  private downloadManager = null;

  constructor(private _http: Http) {
  }

  /**
   * Select download manager to share with other components
   *
   * @param downloadManager
   */
  select(downloadManager) {
    this.downloadManager = downloadManager;
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