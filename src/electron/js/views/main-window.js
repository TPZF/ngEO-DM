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
	}

	/**
	 * Create window, init all events (IPC, browser) and load webapp
	 *
	 * @function createWindow
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

			this.initIPCEvents();
			this.initBrowserWindowEvents();
			this.load();
		}
	}

	/**
	 * @function getBrowserWindow
	 */
	getBrowserWindow() {
		return this._browserWindow;
	}

	/**
	 * @function initIPCEvents
	 */
	initIPCEvents() {

		//
		ipcMain.on('OpenPath', (event, arg) => {
			if (arg !== '') {
				shell.showItemInFolder(arg);
			}
		});

		let _that = this;

		// -------------------------------------------
		// download url
		// -------------------------------------------
		//	start
		ipcMain.on('startDownload', (event, myUrl) => {
			_that.topWindow._startDownload(myUrl, _that);
		});

		ipcMain.on('pauseDownload', (event, myUrl) => {
			_that.topWindow._pauseDownload(myUrl, _that);
		});

		ipcMain.on('cancelDownload', (event, myUrl) => {
			_that.topWindow._cancelDownload(myUrl, _that);
		});

		// -------------------------------------------
		//	settings
		// -------------------------------------------
		ipcMain.on('settings-choosepath', (event) => {
			let myPaths = dialog.showOpenDialog(this._browserWindow, {
				title: 'Choose path directory for downloads',
				properties: ['openDirectory']
			});
			if (typeof myPaths !== 'undefined') {
				event.sender.send('settings-choosepath-reply', myPaths[0]);
			}
		});
		ipcMain.on('settings-get', (event, arg) => {
			if (arg !== '') {
				let val = settings.get(arg);
				if (typeof val !== 'undefined') {
					event.returnValue = val;
				} else {
					event.returnValue = '';
				}
			}
		});
		ipcMain.on('settings-getall', (event, arg) => {
			event.returnValue = settings.getAll();
		});
		ipcMain.on('settings-set', (event, key, value) => {
			logger.debug('ipcMain.settings-set');
			logger.debug('ipcMain.settings-set key=' + key);
			logger.debug('ipcMain.settings-set value=' + value);
			if ((key !== '') && (value !== '')) {
				settings.set(key, value);
				event.returnValue = 'done';
			}
		});
		// -------------------------------------------
	}

	/**
	 * init browser window events
	 *
	 * @function initBrowserWindowEvents
	 */
	initBrowserWindowEvents() {
		// Show window when ready to show
		this._browserWindow.once('ready-to-show', () => {
			logger.debug('MainWindow event ready-to-show');
			this._browserWindow.show();
			this._browserWindow.focus();
		});

		// Clear out the main window when the app is closed
		this._browserWindow.on('closed', () => {
			logger.debug('MainWindow event closed');
			this._browserWindow = null;
			ipcMain.removeAllListeners('OpenPath');
			ipcMain.removeAllListeners('startDownload');
			ipcMain.removeAllListeners('pauseDownload');
			ipcMain.removeAllListeners('cancelDownload');
		});
	}

	/**
	 * load angular app
	 * @function load
	 */
	load() {

		logger.debug('MainWindow.load');

		// Tell Electron where to load the entry point from
		this._browserWindow.loadURL("file://" + rootPath + "/index.html");

		// Open the DevTools.
		if (configuration.isDevMode) {
			logger.debug('MainWindow in dev mode > openDevTools');
			this._browserWindow.webContents.openDevTools();
		}
	}

}

module.exports = MainWindow