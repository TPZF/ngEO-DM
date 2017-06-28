'use strict';

const { dialog } = require('electron');
//const autoUpdater = require('electron-simple-updater');
const { autoUpdater } = require('electron-updater')
const logger = require('../utils/logger');

class AutoUpdaterHandler {

	constructor(myMainWindow) {
		this._autoUpdater = autoUpdater;
		this.mainWindow = myMainWindow;
		this.initListeners();
	}

	initListeners() {

		let _that = this;

		this._autoUpdater.on('error', (error) => {
			logger.error(error);
			dialog.showMessageBox(this.mainWindow.getBrowserWindow(), {
				type: 'error',
				title: 'Check for update',
				message: 'Error on checking for update',
				detail: 'An error has been detected : ' + error + '\nPlease contact administrator.',
				buttons: ['Close']
			});
		});

		this._autoUpdater.on('update-available', () => {
			logger.info('AutoUpdaterHandler.event#update-available');
			dialog.showMessageBox(this.mainWindow.getBrowserWindow(), {
				type: 'warning',
				buttons: ['Update now', 'Cancel'],
				title: 'A new update is available...',
				message: 'A new update is available...'
			}, function (buttonIndex) {
				if (buttonIndex == 0) {
					_that._autoUpdater.quitAndInstall();
				}
			});
		});

		this._autoUpdater.on('update-not-available', (e) => {
			logger.info('AutoUpdaterHandler.event#update-not-available...');
			logger.debug(e);
			if (AutoUpdaterHandler.CHECKED) {
				dialog.showMessageBox(this.mainWindow.getBrowserWindow(), {
					type: 'info',
					title: 'Check for update',
					message: 'Check for update ?',
					detail: 'There is no update available.',
					buttons: ['Close']
				});
			}
			AutoUpdaterHandler.CHECKED = true;
		});

		this._autoUpdater.on('update-downloaded', (e) => {
			logger.info(e);
			dialog.showMessageBox(this.mainWindow.getBrowserWindow(), {
				type: 'warning',
				buttons: ['Update now', 'Cancel'],
				title: 'A new version is available...',
				message: 'A new version is available, upgrade now?'
			}, function (buttonIndex) {
				if (buttonIndex == 0) {
					_that._autoUpdater.quitAndInstall();
				}
			});
		});
	}

	checkForUpdates() {
		this._autoUpdater.checkForUpdates();
	}
}

AutoUpdaterHandler.CHECKED = false;

module.exports = AutoUpdaterHandler
