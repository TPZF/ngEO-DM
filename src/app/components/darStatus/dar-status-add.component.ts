import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

import { DarStatusService } from './../../services/dar-status.service';

import { ProductStatus } from './../../models/dar-status';

@Component({
	selector: 'ngeo-dar-status-add',
	templateUrl: './dar-status-add.component.html',
	styleUrls: ['./dar-status-add.component.scss']
})
export class DarStatusAddComponent implements OnInit {

	@Input() downloadManagerId: string;

	@Output() changeDisplay: EventEmitter<boolean> = new EventEmitter<boolean>();

	private _fileDownload: ProductStatus;
	private _nameInput: string = '';
	private _urlInput: string = '';
	private _expectedSizeInput: string = '';

	constructor(
		private _darStatusService: DarStatusService,
	) { }

	ngOnInit() {
		let _that = this;
		this._initForm();
	}

	add() {
		this._fileDownload.productURL = this._urlInput;
		this._fileDownload.expectedSize = this._expectedSizeInput;
		let myDar = {
			simpledataaccessrequest: {
				createBulkOrder: false,
				requestStage: 'confirmation',
				downloadLocation: {
					DownloadManagerId: this.downloadManagerId,
					DownloadDirectory: '/tmp/'
				},
				productURLs: [
					this._fileDownload
				],
				name: this._nameInput
			}
		};
		this._darStatusService.addSimpleDAR(myDar);
		// hide this form
		this._initForm();
		this.changeDisplay.emit(false);
	}

	private isValidForm() {
		return (this._urlInput && this._expectedSizeInput && this._nameInput);
	}

	private _cancel() {
		this._initForm();
		this.changeDisplay.emit(false);
	}

	private _initForm() {
		this._fileDownload = {
			percentageCompleted: '0',
			expectedSize: '0',
			mode: 'determinate',
			productURL: ''
		};
		this._urlInput = '';
		this._expectedSizeInput = '';
		this._nameInput = 'DAR_' + Math.floor(Math.random() * 1e6);
	}

}
