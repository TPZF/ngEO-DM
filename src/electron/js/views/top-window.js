'use strict';

const { BrowserWindow, Notification } = require('electron');
const settings = require('electron-settings');
const fs = require('fs');
const notifier = require('electron-notifications');

const path = require('path');
const rootPath = path.join(__dirname, './../..');
const assetsPath = path.join(rootPath, 'webapp/assets');

class TopWindow {

	constructor(myLogger) {
		this.logger = myLogger;
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

	/**
	 * @function _saveRessource
	 * @param {object} myResponse
	 * @param {object} myDownloadUrl
	 * @param {object} myMainWindow
	 * @private
	 */
	_saveRessource(myResponse, myDownloadUrl, myMainWindow) {

		this.logger.debug('----------------------------------------------------------------------');
		this.logger.debug('_saveRessource');
		this.logger.debug('----------------------------------------------------------------------');
		this.logger.debug('headers:\n' + JSON.stringify(myResponse.headers));

		let _that = this;

		let _fileName = this._getFileNameFromHeaders(myResponse, myDownloadUrl);
		let _filePath = settings.get('downloadPath') + '/' + _fileName;
		this.logger.debug('_filePath:' + _filePath);

		let _wstream = fs.createWriteStream(_filePath);

		let _bytesDone = 0;
		let _bytesTotal = this._getSizeFromHeaders(myResponse);
		this.logger.debug('ECP bytes total:' + _bytesTotal);

		myResponse.on('data', function (_chunk) {
			_wstream.write(_chunk);
			_bytesDone += _chunk.byteLength;
			//myOptions.logger.debug('ECP ' + _bytesDone + ' bytes done');
			if (myMainWindow.getBrowserWindow()) {
				myMainWindow.mainWindow.webContents.send('downloadUpdated', {
					url: myDownloadUrl.url,
					total: _bytesTotal,
					received: _bytesDone
				});
			}
		})
		myResponse.on('end', function () {
			_wstream.end();
			_that.logger.debug('ECP end');
			if (myMainWindow.getBrowserWindow()) {
				myMainWindow.mainWindow.webContents.send('downloadCompleted', {
					url: myDownloadUrl.url,
					path: _filePath
				});
			} else {
				notifier.notify('Download completed', {
					icon: path.join(assetsPath, 'ngeo-window.png'),
					message: 'The file ' + _fileName + ' is completed !',
					buttons: ['OK']
				});
			}
		})

	}

	_getFileNameFromHeaders(myResponse, myDownloadUrl) {
		let _fileName = '';

		let _disposition = myResponse.headers['Content-Disposition'];
		if (typeof _disposition === 'undefined') {
			_disposition = myResponse.headers['content-disposition'];
		}
		if (typeof _disposition !== 'undefined') {
			// inline; filename="file.txt"
			const _filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
			let _matches = _filenameRegex.exec(_disposition);
			if (_matches != null && _matches[1]) {
				_fileName = _matches[1].replace(/['"]/g, '');
			}
		}
		if (_fileName === '') {
			// extract filename from request pathname
			let _pathName = myDownloadUrl.request.path;
			_fileName = _pathName.substring(_pathName.lastIndexOf('/') + 1);
		}
		if (_fileName === '') {
			_fileName = 'resource.txt';
		}
		return _fileName;
	}

	_getSizeFromHeaders(myResponse) {
		let _size = 0;

		let _contentLength = myResponse.headers['Content-Length'];
		if (typeof _contentLength === 'undefined') {
			_contentLength = myResponse.headers['content-length'];
		}
		if (typeof _contentLength !== 'undefined') {
			_size = parseInt(_contentLength);
		}
		return _size;
	}


}

module.exports = TopWindow