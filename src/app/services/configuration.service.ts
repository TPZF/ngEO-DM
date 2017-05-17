import { Injectable, isDevMode } from '@angular/core';
import { Configuration } from './../models/configuration';

@Injectable()
export class ConfigurationService {

  constructor() { }

  public get(): Configuration {
	if (isDevMode()) {
	    return require('../conf/configuration-dev');
	} else {
		return require('../conf/configuration');
	}
  }
}
