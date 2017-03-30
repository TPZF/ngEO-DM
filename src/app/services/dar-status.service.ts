import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';

import { ErrorService } from './error.service';
import { DarStatus, ProductStatus } from './../models/dar-status';

@Injectable()
export class DarStatusService {

  public darStatuses: Observable<DarStatus[]>;
  public _darStatuses: BehaviorSubject<DarStatus[]>;
  private _dataStore: {
    darStatuses: DarStatus[]
  };

  private headers = new Headers({ 'Content-Type': 'application/json' });
  private baseUrl: string = 'http://localhost:3000/ngeo';
  private _darStatusesUrl = this.baseUrl + '/dataAccessRequestStatuses';

  /**
   * @function constructor
   * @param http
   */
  constructor(private http: Http, private errorService: ErrorService) {
    this._dataStore = { darStatuses: [] };
    this._darStatuses = <BehaviorSubject<DarStatus[]>>new BehaviorSubject([]);
    this.darStatuses = this._darStatuses.asObservable();
  }

  /**
   * @function getDarStatuses
   * @param {string} downloadManagerId
   */
  getDarStatuses(downloadManagerId: string) {
    this.http
    .get(this._darStatusesUrl)
    .map(response => {
      return response.json().dataAccessRequestStatuses;
    })
    .subscribe(data => {
      this._dataStore.darStatuses = [];
      data.forEach((item, index) => {
        if (item.dlManagerId === downloadManagerId) {
          this._dataStore.darStatuses.push(item);
        }
      });
      this._darStatuses.next(Object.assign({}, this._dataStore).darStatuses);
    }, error => {
      console.log('Could not load darStatuses');
    });
  }

  // /**
  //  * @function getDarStatus
  //  * @param id
  //  */
  // getDarStatus(id: string): Observable<DarStatus> {
  //   return this.http
  //   .get(this.darStatusesUrl + '/' + id)
  //   .map((response) => {
  //     return response.json().darStatus;
  //   })
  //   .catch(this.errorService.handleError);
  // }


}
