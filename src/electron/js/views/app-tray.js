'use strict';

// ELECTRON
const { dialog, Menu, nativeImage, Tray } = require('electron');

// ASSETS
const path = require('path');
const assetsPath = path.join(__dirname, '../../webapp/assets');

/**
 * @class AppTray
 */
class AppTray {

	constructor(myTopWindow, myMainWindow, myAppVersion) {
		this.topWindow = myTopWindow;
		this.mainWindow = myMainWindow;
		this.appVersion = myAppVersion;
		this._createTray();
	}

	/**
	 * @function _createTray
	 * @private
	 */
	_createTray() {

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

		const _contextMenu = Menu.buildFromTemplate([
			{ label: 'Show window', type: 'normal', click: () => this._showMainWindow() },
			{ label: 'Check for update', type: 'normal', click: () => this._checkForUpdates() },
			{ label: 'About...', type: 'normal', click: () => this._showAbout() },
			{ label: 'Quit', accelerator: 'CommandOrControl+Q', role: 'quit' }
		]);

		this._tray.setToolTip('ngEO Download Manager');
		this._tray.setContextMenu(_contextMenu);

	}

	/**
	 * show main window if not displays
	 *
	 * @function _showMainWindow
	 * @private
	 */
	_showMainWindow() {
		// if mainWindow is null -> recreate it
		if (this.mainWindow.getBrowserWindow() == null) {
			this.mainWindow.createWindow();
		} else {
			this.mainWindow.getBrowserWindow().show();
		}
	}

	/**
	 * Check for updates with auto updater component
	 *
	 * @function _checkForUpdates
	 * @private
	 */
	_checkForUpdates() {
		if (this.mainWindow.autoUpdater) {
			this.mainWindow.autoUpdater.checkForUpdates();
		}
	}

	/**
	 * Display about message box
	 *
	 * @function _showAbout
	 * @private
	 */
	_showAbout() {
		const _iconImage = nativeImage.createFromPath(path.join(assetsPath, 'ngeo-dialog.png'));
		const _options = {
			type: 'info',
			buttons: ['Close'],
			title: 'About',
			icon: _iconImage,
			message: `The download manager is software which is retrieved and run in standalone.\nIt is used to the download of ngeo product data.\nVersion: ${this.appVersion}`
		};
		if (this.mainWindow.getBrowserWindow()) {
			// attach dialog box to mainWindow, making it modal
			dialog.showMessageBox(
				this.mainWindow.getBrowserWindow(),
				_options
			);
		} else {
			dialog.showMessageBox(
				_options
			);
		}
	}

}

module.exports = AppTray;