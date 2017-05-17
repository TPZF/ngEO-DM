import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigurationService } from './configuration.service';

@Injectable()
export class NgeoService {
  private baseUrl: string;
  constructor(private _http: Http, private _configurationService: ConfigurationService) {
	  this.baseUrl = _configurationService.get().qsHost;
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
