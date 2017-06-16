import { Injectable, isDevMode } from '@angular/core';

@Injectable()
export class ConfigurationService {

	constructor() { }

	public get(): any {
		if (isDevMode()) {
			return require('../conf/configuration-dev');
		} else {
			return require('../conf/configuration');
		}
	}
}
