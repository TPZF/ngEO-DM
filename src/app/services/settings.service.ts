import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable()
export class SettingsService {

	constructor(private _electronService: ElectronService) {

	}

	/**
	 * @function get
	 * @param {string} myKey
	 * @returns {Object}
	 */
	get(myKey: string): any {
		return this._electronService.ipcRenderer.sendSync('settings-get', myKey);
	}

	/**
	 * @function getAll
	 * @returns {Object}
	 */
	getAll(): any {
		return this._electronService.ipcRenderer.sendSync('settings-getall', 'e');
	}

	/**
	 * @function set
	 * @param {string} myKey
	 * @param {string} myValue
	 * @returns {void}
	 */
	set(myKey: string, myValue: any): void {
		this._electronService.ipcRenderer.sendSync('settings-set', myKey, myValue);
	}
}
