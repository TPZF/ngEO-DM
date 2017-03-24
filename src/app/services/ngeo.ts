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
   * Get registered download managers for the given user
   * @param username
   */
  public getDownloadManagers(username: string) {
    // TODO: Make a real request to LWS
    return Observable.of({
      "downloadmanagers": [
        {
          "downloadManagerId": "DM_01",
          "downloadManagerFriendlyName": "Magellium Limited Main DM 1",
          "userId": "esa_user1",
          "status": "ACTIVE",
          "ipAddress": "dmServer.magellium.fr",
          "lastAccessDate": "2001-12-17T09:30:47-05:00"
        },

        {
          "downloadManagerId": "DM_02",
          "downloadManagerFriendlyName": "TPZ Limited Main DM 2",
          "userId": "tpz_user1",
          "status": "INACTIVE",
          "ipAddress": "dmServer.tpz.fr",
          "lastAccessDate": "2012-11-22T09:30:47-05:00"
        }
      ]
    });
    // return this._http.get(this.baseUrl + '/downloadManagers').map((res) => {
    //   return res.json();
    // })
  }
}
