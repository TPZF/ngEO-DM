import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { ElectronService } from 'ngx-electron';
import { SettingsService } from './../../services/settings.service';

@Component({
	selector: 'settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnDestroy, OnInit {

	private PASSWORDCRYPTED: string = '*********';
	private _usernameF: string = 'anonymous';
	private _passwordF: string;
	private _downloadPathF: string;
	private _ipcSettingsChoosepathReplyBound: Function;

	constructor(
		private _router: Router,
		private _electronService: ElectronService,
		private _settingsService: SettingsService) {
	}

	ngOnInit() {
		this._usernameF = this._settingsService.get('username');
		this._passwordF = this.PASSWORDCRYPTED;
		this._downloadPathF = this._settingsService.get('downloadPath');
		// bind settingsChoosepathReply with this to keep this in scope
		this._ipcSettingsChoosepathReplyBound = this._ipcSettingsChoosepathReply.bind(this);
		// listen from electron on settings choose path reply
		this._electronService.ipcRenderer.on('settings-choosepath-reply', this._ipcSettingsChoosepathReplyBound);
	}

	ngOnDestroy() {
		//this._electronService.ipcRenderer.removeAllListeners('settings-choosepath');
		this._electronService.ipcRenderer.removeListener('settings-choosepath-reply', this._ipcSettingsChoosepathReplyBound);
	}

	/**
	 * event listener for ipc settings choose path reply
	 *
	 * @function _ipcSettingsChoosepathReply
	 * @param {*} event
	 * @param {*} arg
	 * @private
	 */
	private _ipcSettingsChoosepathReply(event, arg) {
		this._downloadPathF = arg;
	};

	/**
	 * Choose path open a directory dialog box (managed by electron)
	 * @see {@link main-window.js}
	 * @function choosePath
	 * @private
	 */
	private choosePath() {
		this._electronService.ipcRenderer.send('settings-choosepath');
	}

	/**
	 * Save inputs in settings ad redirect do download managers list
	 *
	 * @function save
	 * @private
	 */
	private save() {
		this._settingsService.set('username', this._usernameF);
		if (this._passwordF !== this.PASSWORDCRYPTED) {
			this._settingsService.set('password', this._passwordF);
		}
		this._settingsService.set('downloadPath', this._downloadPathF);
		this._router.navigate(['downloadManagers']);
	}

	/**
	 * Check is input fields are valids
	 * @function isValidForm
	 * @private
	 */
	private isValidForm() {
		return ((this._usernameF) && (this._passwordF) && (this._downloadPathF));
	}

}
