'use strict';

// ELECTRON
const { BrowserWindow, Notification } = require('electron');

// SETTINGS + CONF + LOGGER
const settings = require('electron-settings');
const configuration = require('./../handlers/configuration');
const logger = require('./../utils/logger');

// ASSETS
const path = require('path');
const rootPath = path.join(__dirname, './../..');
const assetsPath = path.join(rootPath, 'webapp/assets');

class TopWindow {

	constructor() {
		this.downloadHandler = null;
		this.createWindow();
		this.initBrowserWindowEvents();
	}

	createWindow() {
		// Initialize the window to our specified dimensions
		this._browserWindow = new BrowserWindow({
			show: false
		});
	}

	getBrowserWindow() {
		return this._browserWindow;
	}

	initBrowserWindowEvents() {

		let _that = this;

		this._browserWindow.webContents.session.on('will-download', (event, item, webContents) => {

			logger.debug('_browserWindow.willDownload');

			_that.downloadHandler._downloadItems.push(item);

			// Set the save path, making Electron not to prompt a save dialog.
			let _path = settings.get('downloadPath') + '/';
			item.setSavePath(_path + item.getFilename());
			logger.debug('savePath:' + _path + item.getFilename());

			item.on('updated', (event, state) => {

				// check if last url redirect on ECP serviceprovider
				if (item.getURLChain().length > 1) {
					let _lastURL = item.getURLChain()[item.getURLChain().length - 1];
					if (_lastURL.indexOf(configuration.getConf().ecp.serviceprovider.host) > -1) {
						_that.downloadHandler._delDownloadItemByUrl(item.getURLChain()[0]);
						item.cancel();
						return;
					}
				}

				if (state === 'interrupted') {
					logger.info(`Download is interrupted but can be resumed for ${item.getURLChain()[0]}`)
				} else if (state === 'progressing') {
					if (item.isPaused()) {
						logger.info(`Download is paused for ${item.getURLChain()[0]}`)
					} else {
						logger.info(`Received bytes for ${item.getURLChain()[0]} : ${item.getReceivedBytes()}`)
						if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
							logger.debug('send downloadFileUpdated to mainWindow...');
							_that._mainWindow.getBrowserWindow().webContents.send('downloadFileUpdated', {
								url: item.getURLChain()[0],
								total: item.getTotalBytes(),
								received: item.getReceivedBytes()
							});
						}
					}
				}
			});

			item.once('done', (event, state) => {
				if (state === 'completed') {
					logger.info('Completed for ' + item.getURLChain()[0]);
					_that.downloadHandler._delDownloadItemByUrl(item.getURLChain()[0]);
					if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
						logger.debug('send downloadFileCompleted to mainWindow...');
						_that._mainWindow.getBrowserWindow().webContents.send('downloadFileCompleted', {
							url: item.getURLChain()[0],
							urlChain: item.getURLChain(),
							path: _path + item.getFilename()
						});
					}
				} else {
					logger.error(`Download failed for ${item.getURLChain()[0]}: ${state}`);
					if (state === 'cancelled') {
						_that.downloadHandler.startEcpDownload(item.getURLChain()[0]);
					} else {
						if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
							logger.debug('send downloadFileError to mainWindow...');
							_that._mainWindow.getBrowserWindow().webContents.send('downloadFileError', {
								url: item.getURLChain()[0]
							});
						}
					}
				}
			});

		});
	}

	/**
	 * start download of an url
	 * if an item with this url already exists in downloadItems, resume it
	 * TODO
	 * if an item with this url already exists in downloadUrls, resume it
	 *
	 * @function startDownload
	 * @param {string} myUrl
	 * @param {object} myMainWindow - send ipc message on main window
	 */
	_startDownload(myUrl, myMainWindow) {
		if (!this._mainWindow) {
			this._mainWindow = myMainWindow;
		}
		this.downloadHandler.startDownload(myUrl);
	}

	_pauseDownload(myUrl, myMainWindow) {
		this.downloadHandler.pauseDownload(myUrl);
	}

	_cancelDownload(myUrl, myMainWindow) {
		this.downloadHandler.cancelDownload(myUrl);
	}

}

module.exports = TopWindow