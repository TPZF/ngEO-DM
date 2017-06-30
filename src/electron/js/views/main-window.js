'use strict';

// ELECTRON
const { BrowserWindow, dialog, ipcMain, shell } = require('electron');

// SETTINGS + CONF + LOGGER
const settings = require('electron-settings');
const configuration = require('./../handlers/configuration');
const logger = require('./../utils/logger');

// ASSETS PATH
const path = require('path');
const rootPath = path.join(__dirname, './../..');
const assetsPath = path.join(rootPath, 'webapp/assets');

/**
 * @class MainWindow
 */
class MainWindow {

	/**
	 * @constructor
	 * @param {object} myTopWindow
	 */
	constructor(myTopWindow) {
		this.topWindow = myTopWindow;
		this._browserWindow = null;
		this.createWindow();
		this._ipcLogin = this._ipcLogin.bind(this);
	}

	/**
	 * Create window, init all events (IPC, browser) and load webapp
	 *
	 * @function createWindow
	 * @public
	 * @see {@link app-tray.js}
	 */
	createWindow() {

		logger.debug('MainWindow.createWindow');
		if (this._browserWindow == null) {
			// Initialize the window to our specified dimensions
			this._browserWindow = new BrowserWindow({
				icon: path.join(assetsPath, 'ngeo-window.png'),
				parent: this.topWindow.getBrowserWindow(),
				backgroundColor: '#FFFFFF',
				show: false,
				x: 100,
				y: 100,
				minWidth: 800,
				minHeight: 600
			});

			this._initIPCEvents();
			this._initBrowserWindowEvents();
			this._load();
		}
	}

	/**
	 * @function getBrowserWindow
	 * @public
	 */
	getBrowserWindow() {
		return this._browserWindow;
	}

	/**
	 * Listener function for ipc start download
	 *
	 * @function _ipcStartDownload
	 * @param {*} event
	 * @param {*} myUrl
	 * @param {*} myDarName
	 * @private
	 */
	_ipcStartDownload(event, myUrl, myDarName) {
		this.topWindow.startDownload(myUrl, myDarName, this);
	}

	/**
	 * Listener function for ipc stop download
	 *
	 * @function _ipcStopDownload
	 * @param {*} event
	 * @param {*} myUrl
	 * @param {*} myDarName
	 * @private
	 */
	_ipcStopDownload(event, myUrl, myDarName) {
		this.topWindow.stopDownload(myUrl, myDarName, this);
	}

	/**
	 * Listener function for ipc clean download
	 *
	 * @function _ipcCleanDownload
	 * @param {*} event
	 * @param {*} myUrl
	 * @param {*} myDarName
	 * @private
	 */
	_ipcCleanDownload(event, myUrl, myDarName) {
		this.topWindow.cleanDownload(myUrl, myDarName);
	}

	/**
	 * Listener function for ipc settings choose path
	 *
	 * @function _ipcSettingsChoosePath
	 * @param {*} event
	 * @private
	 */
	_ipcSettingsChoosePath(event) {
		logger.debug('_ipcSettingsChoosePath' + this._browserWindow);
		dialog.showOpenDialog(
			this._browserWindow,
			{
				title: 'Choose path directory for downloads',
				properties: ['openDirectory']
			}, (filePaths) => {
				logger.debug(filePaths);
				if (typeof filePaths !== 'undefined') {
					event.sender.send('settings-choosepath-reply', filePaths[0]);
				}
			}
		);
	}

	/**
	 * Listener function for ipc settings get
	 *
	 * @function _ipcSettingsGet
	 * @param {*} event
	 * @param {*} arg
	 * @private
	 */
	_ipcSettingsGet(event, arg) {
		if (arg !== '') {
			let val = settings.get(arg);
			if (typeof val !== 'undefined') {
				event.returnValue = val;
			} else {
				event.returnValue = '';
			}
		}
	}

	/**
	 * Listener function for ipc settings get all
	 *
	 * @function _ipcsettingsGetAll
	 * @param {*} event
	 * @private
	 */
	_ipcSettingGetAll(event) {
		event.returnValue = settings.getAll();
	}

	/**
	 * Listener function for ipc settings set
	 *
	 * @function _ipcSettingsSet
	 * @param {*} event
	 * @param {*} key
	 * @param {*} value
	 * @private
	 */
	_ipcSettingSet(event, key, value) {
		logger.debug('ipcMain.settings-set');
		logger.debug('ipcMain.settings-set key=' + key);
		logger.debug('ipcMain.settings-set value=' + value);
		if ((key !== '') && (typeof value !== 'undefined')) {
			settings.set(key, value);
			event.returnValue = 'done';
		}
	}

	/**
	 * Listener function for ipc login
	 *
	 * @function _ipcLogin
	 * @param {*} event
	 * @private
	 */
	_ipcLogin(event) {
		logger.debug('ipcMain.login');
		this.topWindow.login();
	}

	/**
	 * Init all IPC event listeners
	 *
	 * @function _initIPCEvents
	 * @private
	 */
	_initIPCEvents() {

		//
		ipcMain.on('OpenPath', (event, arg) => {
			if (arg !== '') {
				shell.showItemInFolder(arg);
			}
		});

		// bind with this to keep 'this' in scope of function
		this._ipcStartDownloadBound = this._ipcStartDownload.bind(this);
		this._ipcStopDownloadBound = this._ipcStopDownload.bind(this);
		this._ipcCleanDownloadBound = this._ipcCleanDownload.bind(this);
		this._ipcSettingsChoosePathBound = this._ipcSettingsChoosePath.bind(this);
		this._ipcSettingsGetBound = this._ipcSettingsGet.bind(this);
		this._ipcSettingGetAllBound = this._ipcSettingGetAll.bind(this);
		this._ipcSettingSetBound = this._ipcSettingSet.bind(this);
		this._ipcLoginBound = this._ipcLogin.bind(this);

		// -------------------------------------------
		// download url
		// -------------------------------------------
		//	start
		ipcMain.on('startDownload', this._ipcStartDownloadBound);
		ipcMain.on('stopDownload', this._ipcStopDownloadBound);
		ipcMain.on('cleanDownload', this._ipcCleanDownloadBound);
		// -------------------------------------------
		//	settings
		// -------------------------------------------
		ipcMain.on('settings-choosepath', this._ipcSettingsChoosePathBound);
		ipcMain.on('settings-get', this._ipcSettingsGetBound);
		ipcMain.on('settings-getall', this._ipcSettingGetAllBound);
		ipcMain.on('settings-set', this._ipcSettingSetBound);
		// -------------------------------------------
		// login
		// -------------------------------------------
		ipcMain.on('login', this._ipcLoginBound);
		// -------------------------------------------
	}

	/**
	 * init browser window events
	 *
	 * @function _initBrowserWindowEvents
	 * @private
	 */
	_initBrowserWindowEvents() {
		let _that = this;
		// Show window when ready to show
		this._browserWindow.once('ready-to-show', () => {
			logger.debug('MainWindow event ready-to-show');
			this._browserWindow.show();
			this._browserWindow.focus();

			if (configuration.isDevMode) {
				setInterval(() => {
					if (_that._browserWindow) {
						_that._browserWindow.webContents.send('stats', {
							type: process.type,
							processMemory: process.getProcessMemoryInfo(),
							systemMemory: process.getSystemMemoryInfo()
							/*,
							io: process.getIOCounters()*/
						});
					}
				}, 1000);
			}
		});

		// Clear out the main window when the app is closed
		this._browserWindow.on('closed', () => {
			logger.debug('MainWindow event closed');
			this._browserWindow = null;
			// -------------------------------------------
			ipcMain.removeListener('startDownload', this._ipcStartDownloadBound);
			ipcMain.removeListener('stopDownload', this._ipcStopDownloadBound);
			ipcMain.removeListener('cleanDownload', this._ipcCleanDownloadBound);
			ipcMain.removeListener('settings-choosepath', this._ipcSettingsChoosePathBound);
			ipcMain.removeListener('settings-get', this._ipcSettingsGetBound);
			ipcMain.removeListener('settings-getall', this._ipcSettingGetAllBound);
			ipcMain.removeListener('settings-set', this._ipcSettingSetBound);
			ipcMain.removeListener('login', this._ipcLoginBound);
			// -------------------------------------------
		});
	}

	/**
	 * Load angular app and devtools if devmode
	 *
	 * @function _load
	 * @private
	 */
	_load() {
		logger.debug('MainWindow.load');
		// Tell Electron where to load the entry point from
		this._browserWindow.loadURL("file://" + rootPath + "/webapp/index.html");
		// Open the DevTools.
		if (configuration.isDevMode) {
			logger.debug('MainWindow in dev mode > openDevTools');
			this._browserWindow.webContents.openDevTools();
		}
	}

}

module.exports = MainWindow