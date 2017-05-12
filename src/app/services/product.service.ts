import { Injectable } from '@angular/core';
import { Response, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { ProgressHttp } from 'angular-progress-http';

import { AuthenticationService } from './authentication.service';
import { ErrorService } from './error.service';
import { ElectronService } from 'ngx-electron';

import { DarStatus } from '../models/dar-status';

import * as FileSaver from 'file-saver';

@Injectable()
export class ProductService {

  /**
   * @function constructor
   * @param http
   */
  constructor(
    private _http: ProgressHttp,
    private _authenticationService: AuthenticationService,
    private _errorService: ErrorService) { }

  startDownload(myDar: DarStatus) {
    console.log('startDownload');
    let _i: number = 0;

    myDar.productStatuses.forEach((product) => {
      this._http
        .withDownloadProgressListener(progress => { product.percentageCompleted = '' + progress.percentage; })
        .get(product.productURL, { responseType: ResponseContentType.Blob })
        .subscribe((response) => {
          product.percentageCompleted = '100';
          _i++;
          let _newFileName: string = myDar.ID + '-file-' + _i + '.zip';
          FileSaver.saveAs(response.blob(), _newFileName);
          product.localPath = myDar.downloadDirectory + _newFileName;
        });
    });
    return myDar.status;

  }

  stopDownload(myDar: DarStatus) {
    console.log('stopDownload');
    return myDar.status;

  }

  resumeDownload(myDar: DarStatus) {
    console.log('resumeDownload');
    return myDar.status;

  }

  continueDownload(myDar: DarStatus) {
    console.log('continueDownload');
    return myDar.status;
  }

  checkDownload(myDar: DarStatus) {

    let complete = 0;
    myDar.productStatuses.forEach((product) => {
      if (+product.percentageCompleted === 100) {
        complete++;
      }
    });
    if (complete === myDar.productStatuses.length) {
      myDar.status = 0;
    }
  }

}
