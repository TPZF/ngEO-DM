import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class ErrorService {

	/**
	 * @function handleError
	 * @param error
	 * @public
	 */
	public handleError(error: Response | any) {
		let errMsg: string;
		if (error instanceof Response) {
			errMsg = `${error.status} - ${error.statusText || ''}`;
		} else {
			errMsg = error.message ? error.message : error.toString();
		}
		return Observable.throw(errMsg);
	}

}
