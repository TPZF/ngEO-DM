import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { ElectronService } from 'ngx-electron';
import { SettingsService } from './../../services/settings.service';

@Component({
	selector: 'settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

	private _usernameF: string = 'anonymous';
	private _passwordF: string;
	private _downloadPathF: string;

	constructor(
		private _router: Router,
		private _electronService: ElectronService,
		private _settingsService: SettingsService) {
	}

	ngOnInit() {
		this._usernameF = this._settingsService.get('username');
		this._passwordF = '*********';
		this._downloadPathF = this._settingsService.get('downloadPath');
	}

	private choosePath() {
		this._electronService.ipcRenderer.on('settings-choosepath-reply', (event, arg) => {
			this._downloadPathF = arg;
		});
		this._electronService.ipcRenderer.send('settings-choosepath');
	}

	private save() {
		this._settingsService.set('username', this._usernameF);
		if (this._passwordF !== '*********') {
			this._settingsService.set('password', this._passwordF);
		}
		this._settingsService.set('downloadPath', this._downloadPathF);
		this._router.navigate(['downloadManagers']);
	}

	private isValidForm() {
		return ((this._usernameF) && (this._passwordF) && (this._downloadPathF));
	}

}
