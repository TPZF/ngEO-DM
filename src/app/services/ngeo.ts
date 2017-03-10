import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';

@Injectable()
export class NgeoService {
  baseUrl: string = 'http://localhost:3000/ngeo/catalogue/Landsat57Merged/search'
  constructor(private _http: Http) {
  }

  /**
   * Just a request
   */
  retrieveSomething() {
    return this._http.get(this.baseUrl).map((res) => { return res.json() });
  }
}
