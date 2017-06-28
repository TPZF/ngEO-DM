import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable()
export class IpcRendererService {

	/**
	 * @function constructor
	 */
	constructor(
		private _electronService: ElectronService,
	) {

	}

	initDownload(myNgZone, myDownload) {

		this._electronService.ipcRenderer.on('downloadError', (event, downloadItem) => {
			console.log('downloadError', myDownload.productURL);
			myNgZone.run(() => {
				if (myDownload.productURL === downloadItem.url) {
					myDownload.mode = 'determinate';
					myDownload.errorMsg = JSON.stringify(downloadItem.errorMsg);
				}
			});
		});
		this._electronService.ipcRenderer.on('downloadCompleted', (event, downloadItem) => {
			console.log('downloadCompleted', myDownload.productURL);
			myNgZone.run(() => {
				if (myDownload.productURL === downloadItem.url) {
					myDownload.percentageCompleted = '100';
					myDownload.localPath = downloadItem.path;
				}
			});
		});
		this._electronService.ipcRenderer.on('downloadUpdated', (event, downloadItem) => {
			console.log('downloadUploaded', myDownload.productURL);
			myNgZone.run(() => {
				if (myDownload.productURL === downloadItem.url) {
					myDownload.mode = 'determinate';
					myDownload.expectedSize = downloadItem.total;
					if (parseInt(myDownload.expectedSize, 10) > 0) {
						myDownload.percentageCompleted = '' + Math.floor(parseInt(downloadItem.received, 10) / parseInt(downloadItem.total, 10) * 100);
					}
					myDownload.loadedSize = downloadItem.received;
				}
			});
		});
		this._electronService.ipcRenderer.on('downloadPaused', (event, downloadItem) => {
			console.log('downloadPaused', myDownload.productURL);
			myNgZone.run(() => {
				if (myDownload.productURL === downloadItem.url) {
					myDownload.mode = 'determinate';
				}
			});
		});
		this._electronService.ipcRenderer.on('downloadFileUpdated', (event, downloadItem) => {
			console.log('downloadFileUpdated');
			myNgZone.run(() => {
				if (myDownload.productURL === downloadItem.url) {
					myDownload.mode = 'determinate';
					myDownload.expectedSize = downloadItem.total;
					if (parseInt(myDownload.expectedSize, 10) > 0) {
						myDownload.percentageCompleted = '' + Math.floor(parseInt(downloadItem.received, 10) / parseInt(downloadItem.total, 10) * 100);
					}
					myDownload.loadedSize = downloadItem.received;
				}
			});
		});
		this._electronService.ipcRenderer.on('downloadFileCompleted', (event, downloadItem) => {
			console.log('downloadFileCompleted');
			myNgZone.run(() => {
				if (myDownload.productURL === downloadItem.url) {
					myDownload.mode = 'determinate';
					myDownload.percentageCompleted = '100';
					myDownload.localPath = downloadItem.path;
				}
			});
		});
		this._electronService.ipcRenderer.on('downloadFileError', (event, downloadItem) => {
			console.log('downloadFileError');
			myNgZone.run(() => {
				if (myDownload.productURL === downloadItem.url) {
					myDownload.mode = 'determinate';
					myDownload.percentageCompleted = '0';
					myDownload.loadedSize = '0';
					myDownload.errorMsg = JSON.stringify(downloadItem.errorMsg);
				}
			});
		});
	}

	initDownloadForDarStatus(myNgZone, myDarStatus) {
		// listener on downloadCompleted
		this._electronService.ipcRenderer.on('downloadCompleted', (event, downloadItem) => {
			myNgZone.run(() => {
				myDarStatus.productStatuses.forEach(_product => {
					if (_product.productURL === downloadItem.url) {
						console.log('downloadCompleted', downloadItem);
						_product.percentageCompleted = '100';
						_product.localPath = downloadItem.path;
					}
				});
			});
		});

		// listener on downloadUploaded
		this._electronService.ipcRenderer.on('downloadUpdated', (event, downloadItem) => {
			myNgZone.run(() => {
				myDarStatus.productStatuses.forEach(_product => {
					if (_product.productURL === downloadItem.url) {
						_product.mode = 'determinate';
						_product.expectedSize = downloadItem.total;
						if (parseInt(_product.expectedSize, 10) > 0) {
							_product.percentageCompleted = '' + Math.floor(parseInt(downloadItem.received, 10) / parseInt(downloadItem.total, 10) * 100);
						}
						_product.loadedSize = downloadItem.received;
					}
				});
			});
		});

		this._electronService.ipcRenderer.on('downloadPaused', (event, downloadItem) => {
			myNgZone.run(() => {
				myDarStatus.productStatuses.forEach(_product => {
					if (_product.productURL === downloadItem.url) {
						_product.mode = 'determinate';
					}
				});
			});
		});

		// listener on downloadError
		this._electronService.ipcRenderer.on('downloadError', (event, downloadItem) => {
			myNgZone.run(() => {
				myDarStatus.productStatuses.forEach(_product => {
					if (_product.productURL === downloadItem.url) {
						console.log('downloadError', downloadItem);
						_product.mode = 'determinate';
						_product.errorMsg = JSON.stringify(downloadItem.errorMsg);
					}
				});
			});
		});

		this._electronService.ipcRenderer.on('downloadFileUpdated', (event, downloadItem) => {
			myNgZone.run(() => {
				myDarStatus.productStatuses.forEach(_product => {
					if (_product.productURL === downloadItem.url) {
						_product.mode = 'determinate';
						_product.expectedSize = downloadItem.total;
						if (parseInt(_product.expectedSize, 10) > 0) {
							_product.percentageCompleted = '' + Math.floor(parseInt(downloadItem.received, 10) / parseInt(downloadItem.total, 10) * 100);
						}
						_product.loadedSize = downloadItem.received;
					}
				});
			});
		});
		this._electronService.ipcRenderer.on('downloadFileCompleted', (event, downloadItem) => {
			myNgZone.run(() => {
				myDarStatus.productStatuses.forEach(_product => {
					if (_product.productURL === downloadItem.url) {
						console.log('downloadFileCompleted', downloadItem);
						_product.mode = 'determinate';
						_product.percentageCompleted = '100';
						_product.localPath = downloadItem.path;
					}
				});
			});
		});
		this._electronService.ipcRenderer.on('downloadFileError', (event, downloadItem) => {
			myNgZone.run(() => {
				myDarStatus.productStatuses.forEach(_product => {
					if (_product.productURL === downloadItem.url) {
						console.log('downloadFileError', downloadItem);
						_product.mode = 'indeterminate';
						_product.percentageCompleted = '0';
						_product.loadedSize = '0';
						_product.errorMsg = JSON.stringify(downloadItem.errorMsg);
					}
				});
			});
		});
	}

	destroyDownload() {
		// remove listeners to avoid memory leak
		this._electronService.ipcRenderer.removeAllListeners('downloadError');
		this._electronService.ipcRenderer.removeAllListeners('downloadPaused');
		this._electronService.ipcRenderer.removeAllListeners('downloadUpdated');
		this._electronService.ipcRenderer.removeAllListeners('downloadCompleted');
		this._electronService.ipcRenderer.removeAllListeners('downloadFileError');
		this._electronService.ipcRenderer.removeAllListeners('downloadFileUpdated');
		this._electronService.ipcRenderer.removeAllListeners('downloadFileCompleted');
	}
}
