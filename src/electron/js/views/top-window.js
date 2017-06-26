'use strict';

const { BrowserWindow, Notification } = require('electron');
const settings = require('electron-settings');
const fs = require('fs');
const notifier = require('electron-notifications');

const configuration = require('./../handlers/configuration');

const path = require('path');
const rootPath = path.join(__dirname, './../..');
const assetsPath = path.join(rootPath, 'webapp/assets');


class TopWindow {

	constructor(myLogger, myIsDev) {
		this.logger = myLogger;
		this._isDev = myIsDev;
		this.downloadItems = [];
		this.downloadUrls = [];
		this.downloadRequests = [];
		this.createWindow();
		this.initWindowEvents();
	}

	createWindow() {
		// Initialize the window to our specified dimensions
		this._bw = new BrowserWindow({
			show: false
		});

	}

	getBrowserWindow() {
		return this._bw;
	}

	initWindowEvents() {

		let _that = this;

		this._bw.webContents.session.on('will-download', (event, item, webContents) => {

			_that.logger.debug('_bw.willDownload');

			_that._downloadHandler._downloadItems.push(item);

			// Set the save path, making Electron not to prompt a save dialog.
			let _path = settings.get('downloadPath') + '/';
			item.setSavePath(_path + item.getFilename());
			_that.logger.debug('savePath:' + _path + item.getFilename());

			item.on('updated', (event, state) => {

				// check if last url redirect on ECP serviceprovider
				if (item.getURLChain().length > 1) {
					let _lastURL = item.getURLChain()[item.getURLChain().length - 1];
					if (_lastURL.indexOf(configuration.getConf(_that._isDev).ecp.serviceprovider.host) > -1) {
						_that._downloadHandler._delDownloadItemByUrl(item.getURLChain()[0]);
						item.cancel();
						return;
					}
				}

				if (state === 'interrupted') {
					_that.logger.info(`Download is interrupted but can be resumed for ${item.getURLChain()[0]}`)
				} else if (state === 'progressing') {
					if (item.isPaused()) {
						_that.logger.info(`Download is paused for ${item.getURLChain()[0]}`)
					} else {
						_that.logger.info(`Received bytes for ${item.getURLChain()[0]} : ${item.getReceivedBytes()}`)
						if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
							_that.logger.debug('send downloadFileUpdated to mainWindow...');
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
					_that.logger.info('Completed for ' + item.getURLChain()[0]);
					_that._downloadHandler._delDownloadItemByUrl(item.getURLChain()[0]);
					if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
						_that.logger.debug('send downloadFileCompleted to mainWindow...');
						_that._mainWindow.getBrowserWindow().webContents.send('downloadFileCompleted', {
							url: item.getURLChain()[0],
							urlChain: item.getURLChain(),
							path: _path + item.getFilename()
						});
					}
				} else {
					_that.logger.error(`Download failed for ${item.getURLChain()[0]}: ${state}`);
					if (state === 'cancelled') {
						_that._downloadHandler.startEcpDownload(item.getURLChain()[0]);
					} else {
						if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
							_that.logger.debug('send downloadFileError to mainWindow...');
							_that.mainWindow.getBrowserWindow().webContents.send('downloadFileError', {
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
	 * @param {object} myMainWindow
	 */
	_startDownload(myUrl, myMainWindow) {
		if (!this._mainWindow) {
			this._mainWindow = myMainWindow;
		}
		this._downloadHandler.startDownload(myUrl, myMainWindow);
	}


}

module.exports = TopWindow