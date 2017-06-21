// Imports
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute, Router } from '@angular/router';

import { DownloadManagerService } from './../../services/download-manager.service';
import { DownloadManager } from './../../models/download-manager';
import { DarStatusService } from './../../services/dar-status.service';

@Component({
	selector: 'download-manager-details',
	templateUrl: './download-manager-details.component.html',
	styleUrls: ['./download-manager-details.component.scss']
})
// Component class implementing OnInit
export class DownloadManagerDetailsComponent implements OnDestroy, OnInit {
	// Private properties for binding
	private _sub: any;
	private _displayAdd: Boolean = false;

	private downloadManager: DownloadManager;

	constructor(
		private _downloadManagerService: DownloadManagerService,
		private _darStatusService: DarStatusService,
		private _route: ActivatedRoute,
		private _router: Router) {
	}

	// Load data ones component is ready
	ngOnInit() {
		// Subscribe to route params
		this._sub = this._route.params.subscribe(params => {
			let id = params['id'];
			// Retrieve item with Id route param
			this._downloadManagerService.getDownloadManager(id).subscribe(_downloadManager => this.downloadManager = _downloadManager);
		});
	}

	ngOnDestroy() {
		// Clean sub to avoid memory leak
		this._sub.unsubscribe();
	}

	private delete() {
		this._downloadManagerService
			.deleteOne(this.downloadManager.downloadManagerId)
			.subscribe(_resp => {
				if (_resp) {
					this._router.navigate(['/downloadManagers']);
				}
			});
	}

}
