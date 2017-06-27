'use strict';

const { app, dialog, Menu, nativeImage, Tray, ipcMain } = require('electron');

const path = require('path');
const MainWindow = require('./main-window');
const assetsPath = path.join(__dirname, '../../webapp/assets');
const logger = require('../utils/logger');

class AppTray {

	constructor(myTopWindow, myMainWindow, myAppVersion) {
		this._topWindow = myTopWindow;
		this._mainWindow = myMainWindow;
		this._appVersion = myAppVersion;
		this.createTray();
	}

	createTray() {

		let _image;
		if (process.platform === 'win32') {
			_image = nativeImage.createFromPath(path.join(assetsPath, 'ngeo-tray-macos.png'));
		} else if (process.platform === 'linux') {
			_image = nativeImage.createFromPath(path.join(assetsPath, 'ngeo-tray.png'));
		} else {
			_image = nativeImage.createFromPath(path.join(assetsPath, 'ngeo-tray-macos.png'));
		}
		_image.setTemplateImage(true);

		this._tray = new Tray(_image);
		this._tray.setToolTip('ngEO Download manager');

		ipcMain.on('refreshIcon', () => this.refreshIcon());

		const _contextMenu = Menu.buildFromTemplate([
			{ label: 'Show window', type: 'normal', click: () => this.showMainWindow() },
			{ label: 'Check for update', type: 'normal', click: () => this.checkForUpdates() },
			{ label: 'About...', type: 'normal', click: () => this.showAbout() },
			{ label: 'Quit', accelerator: 'CommandOrControl+Q', role: 'quit' }
		]);

		this._tray.setToolTip('ngEO Download Manager');
		this._tray.setContextMenu(_contextMenu);

	}

	setTitle(myTitle) {
		this._tray.setTitle(myTitle);
	}

	showMainWindow() {
		logger.debug('AppTray.showMainWindow()');
		// if mainWindow is null -> recreate it
		if (this._mainWindow.getBrowserWindow() == null) {
			this._mainWindow.createWindow();
		} else {
			this._mainWindow.getBrowserWindow().show();
		}
	}

	checkForUpdates() {
		if (this._mainWindow._autoUpdater) {
			this._mainWindow._autoUpdater.checkForUpdates();
		}
	}

	/**
	 * Display about message box
	 *
	 * @function showAbout
	 */
	showAbout() {
		const _iconImage = nativeImage.createFromPath(path.join(assetsPath, 'ngeo-dialog.png'));
		const _options = {
			type: 'info',
			buttons: ['Close'],
			title: 'About',
			icon: _iconImage,
			message: `The download manager is software which is retrieved and run in standalone.\nIt is used to the download of ngeo product data.\nVersion: ${this._appVersion}`
		};
		if (this._mainWindow.getBrowserWindow()) {
			// attach dialog box to mainWindow, making it modal
			dialog.showMessageBox(
				this._mainWindow.getBrowserWindow(),
				_options
			);
		} else {
			dialog.showMessageBox(
				_options
			);
		}
	}

	refreshIcon() {
		//this._tray.setImage();
	}
}

module.exports = AppTray;