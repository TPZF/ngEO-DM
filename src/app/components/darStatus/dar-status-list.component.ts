// Imports
import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { DarStatusService } from './../../services/dar-status.service';
import { DarStatus } from './../../models/dar-status';

@Component({
	selector: 'ngeo-dar-status-list',
	templateUrl: './dar-status-list.component.html',
	styleUrls: ['./dar-status-list.component.scss']
})
// Component class implementing OnInit
export class DarStatusListComponent implements OnInit {

	@Input() downloadManagerId: string;

	// Private property for binding
	private errorMessage: string;
	private darStatuses: Observable<DarStatus[]>;
	//private singleDarStatus$: Observable<DarStatus>;

	constructor(private darStatusService: DarStatusService) { }

	// Load data ones componet is ready
	ngOnInit() {

		this.darStatuses = this.darStatusService.darStatuses; // subscribe to entire collection

		//this.singleDarStatus$ = this.darStatusService.darStatuses.map(darStatuses => darStatuses.find(item => item.dlManagerId === this.downloadManagerId));

		this.darStatusService.getDarStatuses(this.downloadManagerId);
	}

	isActive(myDownloadManager) {
		return myDownloadManager.status === 'ACTIVE';
	}

}
