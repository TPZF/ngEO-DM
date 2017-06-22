'use strict';

const { BrowserWindow } = require('electron');

class TopWindow {

	constructor() {
		this.createWindow();
		this.initWindowEvents();
	}

	createWindow() {
		// Initialize the window to our specified dimensions
		this.topWindow = new BrowserWindow({
			show: false
		});

	}

	getBrowserWindow() {
		return this.topWindow;
	}

	initWindowEvents() {

		this.topWindow.webContents.on('did-get-redirect-request', (event, oldURL, newURL, isMainFrame, httpResponseCode, requestMethod, referrer, headers) => {
			//console.log('did-get-redirect-request', JSON.stringify(headers));
		});

		this.topWindow.webContents.session.on('will-download', (event, item, webContents) => {

			/*log.debug('topWindow.willDownload');

			downloadItems.push(item);

			let _path = settings.get('downloadPath') === '' ? currentPath : settings.get('downloadPath') + '/';

			// Set the save path, making Electron not to prompt a save dialog.
			item.setSavePath(_path + item.getFilename());
			log.debug('savePath:' + _path + item.getFilename());

			item.on('updated', (event, state) => {

				// check if last url redirect on ECP serviceprovider
				if (item.getURLChain().length > 1) {
					let _lastURL = item.getURLChain()[item.getURLChain().length - 1];
					if (_lastURL.indexOf(configuration.ecp.serviceprovider.host) > -1) {
						_delDownloadItemByUrl(item.getURLChain()[0]);
						item.cancel();
						return;
					}
				}

				if (state === 'interrupted') {
					log.info(`Download is interrupted but can be resumed for ${item.getURLChain()[0]}`)
				} else if (state === 'progressing') {
					if (item.isPaused()) {
						log.info(`Download is paused for ${item.getURLChain()[0]}`)
					} else {
						log.info(`Received bytes for ${item.getURLChain()[0]} : ${item.getReceivedBytes()}`)
						if (mainWindow) {
							log.debug('send downloadFileUpdated to mainWindow...');
							mainWindow.webContents.send('downloadFileUpdated', {
								url: item.getURLChain()[0],
								progress: item.getReceivedBytes() / item.getTotalBytes(),
								received: item.getReceivedBytes()
							});
						}
					}
				}
			})
			item.once('done', (event, state) => {
				if (state === 'completed') {
					log.info('Completed for ' + item.getURLChain()[0]);
					_delDownloadItemByUrl(item.getURLChain()[0]);
					if (mainWindow) {
						log.debug('send downloadFileCompleted to mainWindow...');
						mainWindow.webContents.send('downloadFileCompleted', {
							url: item.getURLChain()[0],
							urlChain: item.getURLChain(),
							path: _path + item.getFilename()
						});
					}
				} else {
					log.error(`Download failed for ${item.getURLChain()[0]}: ${state}`)
					if (mainWindow) {
						log.debug('send downloadFileError to mainWindow...');
						mainWindow.webContents.send('downloadFileError', {
							url: item.getURLChain()[0]
						});
					}
				}
			})
			*/
		});
	}

}

module.exports = TopWindow