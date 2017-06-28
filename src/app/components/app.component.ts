import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';

import { ElectronService } from 'ngx-electron';

/*
 * App Component
 */
@Component({
	selector: 'app',
	styleUrls: ['./app.component.scss'],
	templateUrl: './app.component.html'
})
export class AppComponent implements OnDestroy, OnInit {

	private _stats: any;

	constructor(
		private _electronService: ElectronService,
		private _ngZone: NgZone
	) { }

	ngOnInit() {
		let _that = this;
		this._electronService.ipcRenderer.on('stats', (event, statsItem) => {
			_that._ngZone.run(() => {
				_that._stats = statsItem;
			});
		});

	}

	ngOnDestroy() {
		this._electronService.ipcRenderer.removeAllListeners('stats');
	}

	closeStats() {
		this._electronService.ipcRenderer.removeAllListeners('stats');
		this._stats = undefined;
	}
}
