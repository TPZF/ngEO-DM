'use strict';

// ELECTRON
const { BrowserWindow } = require('electron');

const notifier = require('electron-notifications');

// SETTINGS + CONF + LOGGER
const configuration = require('./../handlers/configuration');
const logger = require('./../utils/logger');

// ASSETS
const path = require('path');
const rootPath = path.join(__dirname, '../..');
const assetsPath = path.join(rootPath, 'webapp/assets');

class TopWindow {

	constructor() {
		this.downloadHandler = null;
		this.createWindow();
		this._initBrowserWindowEvents();
	}

	/**
	 * @function createWindow
	 * @public
	 * @see {@link ../main.js}
	 */
	createWindow() {
		// Initialize the window to our specified dimensions
		this._browserWindow = new BrowserWindow({
			show: false
		});
	}

	/**
	 * @function getBrowserWindow
	 * @public
	 */
	getBrowserWindow() {
		return this._browserWindow;
	}

	/**
	 * start download of an url
	 *
	 * @function startDownload
	 * @param {string} myUrl
	 * @param {string} myDarName
	 * @param {object} myMainWindow - send ipc message on main window
	 * @public
	 * @see {@link main-window.js}
	 */
	startDownload(myUrl, myDarName, myMainWindow) {
		if (!this._mainWindow) {
			this._mainWindow = myMainWindow;
		}
		this.downloadHandler.startDownload(myUrl, myDarName);
	}

	/**
	 * @function stopDownload
	 * @param {string} myUrl
	 * @param {string} myDarName
	 * @public
	 * @see {@link main-window.js}
	 */
	stopDownload(myUrl, myDarName) {
		this.downloadHandler.stopDownload(myUrl, myDarName);
	}

	/**
	 *
	 * @function cleanDownload
	 * @param {string} myUrl
	 * @param {string} myDarName
	 * @public
	 * @see {@link main-window.js}
	 */
	cleanDownload(myUrl, myDarName) {
		this.downloadHandler.cleanDownload(myUrl, myDarName);
	}

	/**
	 * @function _initBrowserWindowEvents
	 * @private
	 */
	_initBrowserWindowEvents() {

		let _that = this;

		this._browserWindow.webContents.session.on('will-download', (event, item) => {

			logger.debug('#top-window# _browserWindow.willDownload');

			let _download = _that.downloadHandler._getLastInDownloads(item.getURLChain()[0]);
			_download.item = item;

			// Set the save path, making Electron not to prompt a save dialog.
			let _path = _download.pathFolder + '/';
			item.setSavePath(_path + item.getFilename());
			logger.debug('#top-window# _browserWindow.willDownload > savePath:' + _path + item.getFilename());

			item.on('updated', (event, state) => {

				// check if last url redirect on ECP serviceprovider
				if (item.getURLChain().length > 1) {
					let _lastURL = item.getURLChain()[item.getURLChain().length - 1];
					if (_lastURL.indexOf(configuration.getConf().ecp.serviceprovider.host) > -1) {
						delete _download.item;
						_that.downloadHandler.startEcpDownload(item.getURLChain()[0], _download.darName);
						item.cancel();
						return;
					}
				}

				if (state === 'interrupted') {
					logger.info(`#top-window# _browserWindow.willDownload > Download is interrupted but can be resumed for ${item.getURLChain()[0]}`)
					_download.status = 'paused';
				} else if (state === 'progressing') {
					if (item.isPaused()) {
						logger.info(`#top-window# _browserWindow.willDownload > Download is paused for ${item.getURLChain()[0]}`)
					} else {
						logger.info(`#top-window# _browserWindow.willDownload > Received bytes for ${item.getURLChain()[0]} : ${item.getReceivedBytes()}`)
						if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
							logger.debug('#top-window# _browserWindow.willDownload > send downloadFileUpdated to mainWindow...');
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
					logger.info('#top-window# _browserWindow.willDownload > Completed for ' + item.getURLChain()[0]);
					_download.status = 'completed';
					if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
						logger.debug('send downloadFileCompleted to mainWindow...');
						_that._mainWindow.getBrowserWindow().webContents.send('downloadFileCompleted', {
							url: item.getURLChain()[0],
							urlChain: item.getURLChain(),
							path: _path + item.getFilename()
						});
					} else {
						notifier.notify('Download completed', {
						icon: path.join(assetsPath, 'ngeo-window.png'),
						message: 'The file ' + item.getFilename() + ' is completed !',
						buttons: ['OK']
					});
				}
				} else {
					logger.error(`#top-window# _browserWindow.willDownload > Download failed for ${item.getURLChain()[0]}: ${state}`);
					// if state is cancelled then it will be caused by ECP redirect
					// so it s not an error
					if (state !== 'cancelled') {
						_download.status = 'error';
						if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
							logger.debug('#top-window# _browserWindow.willDownload > send downloadFileError to mainWindow...');
							_that._mainWindow.getBrowserWindow().webContents.send('downloadFileError', {
								url: item.getURLChain()[0]
							});
						}
					}
				}
			});

		});
	}

}

module.exports = TopWindow