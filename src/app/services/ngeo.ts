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
}
