'use strict';

const { BrowserWindow, dialog, ipcMain, shell } = require('electron');
const http = require('http');
const https = require('https');
const path = require('path');
const URL = require('url');
const settings = require('electron-settings');

const configuration = require('../handlers/configuration');
const ecp = require('../ecp');
const rootPath = path.join(__dirname, './../..');
const assetsPath = path.join(rootPath, 'webapp/assets');
const logger = require('../utils/logger');

class MainWindow {

	constructor(myTopWindow) {
		this.topWindow = myTopWindow;
		this._bw = null;
		this.downloadItems = [];
		this.downloadUrls = [];
		this.downloadRequests = [];
		this.createWindow();
	}

	createWindow() {

		logger.debug('MainWindow.createWindow');
		// Initialize the window to our specified dimensions
		this._bw = new BrowserWindow({
			icon: path.join(assetsPath, 'ngeo-window.png'),
			parent: this.topWindow._bw,
			backgroundColor: '#FFFFFF',
			show: false,
			x: 100,
			y: 100,
			minWidth: 800,
			minHeight: 600
		});

		this.initIPCEvents();
		this.initWindowEvents();
		this.load();

	}

	getBrowserWindow() {
		return this._bw;
	}

	initWindowEvents() {
		// Show window when ready to show
		this._bw.once('ready-to-show', () => {
			logger.debug('MainWindow event ready-to-show');
			this._bw.show();
			this._bw.focus();
		});

		// Clear out the main window when the app is closed
		this._bw.on('closed', () => {
			logger.debug('MainWindow event closed');
			this._bw = null;
		});

	}

	load() {

		logger.debug('MainWindow.load');

		// Tell Electron where to load the entry point from
		this._bw.loadURL("file://" + rootPath + "/index.html");

		// Open the DevTools.
		if (configuration.isDevMode) {
			logger.debug('MainWindow in dev mode > openDevTools');
			this._bw.webContents.openDevTools();
		}
	}

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

		// -------------------------------------------
		// download with ECP
		// -------------------------------------------
		// start
		ipcMain.on('startEcpDownload', (event, myProduct) => {
			logger.debug('ipcMain.startEcpDownload');
			let _options = {
				credentials: {
					username: settings.get('username'),
					password: settings.get('password')
				},
				path: settings.get('downloadPath') + '/',
				configuration: configuration.getConf()
			};
			_options.url = myProduct.productURL;
			ecp.downloadURL(_options)
				.then((_resp) => {
					_that._startDownloadFile(_resp.url, _resp.request);
				})
				.catch((_err) => {
					_that.mainWindow.webContents.send('downloadError', {
						url: _err.url,
						errorMsg: _err.errorMsg
					});
				})
		});

		// -------------------------------------------
		// download file
		// -------------------------------------------
		//	start
		ipcMain.on('startDirectDownload', (event, myUrlFile) => {
			_that._startDownloadFile(myUrlFile);
		});
		// pause
		ipcMain.on('pauseDownloadFile', (event, myUrlFile) => {
			logger.debug('ipcMain.pauseDownloadFile');
			let _item = _that._getDownloadItemByUrl(myUrlFile);
			if (_item !== null) {
				logger.debug('ipcMain.cancelDownloadFile item not null > pause it !');
				_item.pause();
			}
		});
		// cancel
		ipcMain.on('cancelDownloadFile', (event, myUrlFile) => {
			logger.debug('ipcMain.cancelDownloadFile');
			let _item = _that._getDownloadItemByUrl(myUrlFile);
			if (_item !== null) {
				logger.debug('ipcMain.cancelDownloadFile item not null > cancel it !');
				_that._delDownloadItemByUrl(myUrlFile);
				_item.cancel();
			}
		});

		// -------------------------------------------
		// Download DAR
		// -------------------------------------------
		// start
		ipcMain.on('startDownloadDar', (event, myDar) => {
			logger.debug('ipcMain.startDownloadDar');
			var wc = _that.topWindow.webContents;
			myDar.productStatuses.forEach((product) => {
				let item = _that._getDownloadItemByUrl(product.productURL);
				if (item !== null && item.isPaused()) {
					logger.debug('ipcMain.startDownloadDar item not null > resume it !');
					item.resume();
				} else {
					logger.debug('ipcMain.startDownloadDar item null > download it !');
					logger.debug('url: ' + product.productURL);

					wc.downloadURL(product.productURL);
				}
			});
		});
		// pause
		ipcMain.on('pauseDownloadDar', (event, myDar) => {
			logger.debug('ipcMain.pauseDownloadDar');
			myDar.productStatuses.forEach((product) => {
				let item = _that._getDownloadItemByUrl(product.productURL);
				if (item !== null) {
					logger.debug('ipcMain.cancelDownloadDar item not null > pause it !');
					item.pause();
				}
			});
		});
		// cancel
		ipcMain.on('cancelDownloadDar', (event, myDar) => {
			logger.debug('ipcMain.cancelDownloadDar');
			myDar.productStatuses.forEach((product) => {
				let item = _that._getDownloadItemByUrl(product.productURL);
				if (item !== null) {
					logger.debug('ipcMain.cancelDownloadDar item not null > cancel it !');
					item.cancel();
				}
			});
		});
		// -------------------------------------------
		//	settings
		// -------------------------------------------
		ipcMain.on('settings-choosepath', (event) => {
			let myPaths = dialog.showOpenDialog(this._bw, {
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
	 * Find and return item from downloadItems array
	 * which matches with myUrl input
	 *
	 * @function _getDownloadItemByUrl
	 * @param {string} myUrl
	 * @returns {DownloadItem | null}
	 * @private
	 */
	_getDownloadItemByUrl(myUrl) {
		let _result = null;
		if (this.downloadItems) {
			logger.debug('_getDownloadItemByUrl items.length ' + this.downloadItems.length);
			this.downloadItems.forEach((_item) => {
				if (_item.getURLChain()[0] === myUrl) {
					_result = _item;
				}
			});
		}
		logger.debug('_getDownloadItemByUrl ' + _result);
		return _result;
	}

	/**
	 * Del from downloadItems array
	 * if one url in chain is like myUrl
	 *
	 * @function _delDownloadItemByUrl
	 * @param {string} myUrl
	 * @returns {void}
	 * @private
	 */
	_delDownloadItemByUrl(myUrl) {
		let _newDownloadItems = [];
		if (this.downloadItems) {
			logger.debug('_delDownloadItemByUrl old array ' + this.downloadItems.length);
			downloadItems.forEach((_item) => {
				// getURLChain()[0] is the first url called
				if (_item.getURLChain()[0] !== myUrl) {
					_newDownloadItems.push(_item);
				}
			});
		}
		this.downloadItems = _newDownloadItems;
		logger.debug('_delDownloadItemByUrl new array ' + this.downloadItems.length);
	}

	_startDownloadFile(myUrl, myRequest) {
		logger.debug('ipcMain.startDownloadFile');
		let _item = this._getDownloadByUrl(myUrl);
		if (_item !== null && _item.isPaused) {
			logger.debug('ipcMain.startDownloadFile item already exists > resume it !');
			this._resumeDownloadUrl(_item);
		} else {
			logger.debug('ipcMain.startDownloadFile item null > download it !');
			logger.debug(myRequest);
			if (typeof myRequest === 'undefined') {
				let _url = URL.parse(myUrl);
				let _path = _url.pathname + (_url.search == null ? '' : _url.search);
				myRequest = {
					host: _url.host,
					hostname: _url.hostname,
					protocol: _url.protocol,
					port: _url.port,
					path: _path,
					method: 'GET'
				};
			}
			let downloadUrl = {
				url: myUrl,
				request: myRequest
			};
			this.downloadUrls.push(downloadUrl);
			logger.debug(this.downloadUrls.length);
			this._startDownloadUrl(downloadUrl);
		}
	}

	_startDownloadUrl(myDownloadUrl) {

		let _that = this;

		logger.debug('_startDownloadUrl ' + myDownloadUrl.url);
		logger.debug('_startDownloadUrl ' + JSON.stringify(myDownloadUrl.request));
		// request
		let _req;
		if (myDownloadUrl.url.indexOf('https') === 0) {
			_req = https.request(myDownloadUrl.request, (_resp) => {
				_that.topWindow._saveRessource(_resp, myDownloadUrl, _that);
			});
		} else {
			_req = http.request(myDownloadUrl.request, (_resp) => {
				_that.topWindow._saveRessource(_resp, myDownloadUrl, _that);
			});
		}

		this.downloadRequests.push(_req);

		_req.on('error', (e) => {
			if (e.code !== 'HPE_INVALID_CONSTANT') {
				logger.error('_startDownloadUrl error ' + JSON.stringify(e));
				_that.mainWindow.webContents.send('downloadError', {
					url: myDownloadUrl.url,
					errorMsg: e
				});
			}
		});
		_req.end();
	}

	_resumeDownloadUrl(myDownloadUrl) {
		logger.debug('_resumeDownloadUrl ' + myDownloadUrl.url);
	}

	/**
	 * Find and return item from downloadItems array
	 * which matches with myUrl input
	 *
	 * @function _getDownloadFileByUrl
	 * @param {string} myUrl
	 * @returns {DownloadItem | null}
	 * @private
	 */
	_getDownloadByUrl(myUrl) {
		let _result = null;
		if (this.downloadUrls) {
			logger.debug('_getDownloadByUrl items.length ' + this.downloadUrls.length);
			this.downloadUrls.forEach((_downloadUrl) => {
				if (_downloadUrl.url === myUrl) {
					_result = _downloadUrl;
				}
			});
		}
		logger.debug('_getDownloadByUrl ' + _result);
		return _result;
	}

	/**
	 * Del from downloadItems array
	 * if one url in chain is like myUrl
	 *
	 * @function _delDownloadByUrl
	 * @param {string} myUrl
	 * @returns {void}
	 * @private
	 */
	_delDownloadByUrl(myUrl) {
		let _newDownloadUrls = [];
		if (this.downloadUrls) {
			logger.debug('_delDownloadByUrl old array ' + this.downloadUrls.length);
			this.downloadUrls.forEach((_downloadUrl) => {
				// getURLChain()[0] is the first url called
				if (_downloadUrl.url !== myUrl) {
					_newDownloadUrls.push(_downloadUrl);
				}
			});
		}
		this.downloadUrls = _newDownloadUrls;
		logger.debug('_delDownloadByUrl new array ' + this.downloadUrls.length);
	}


}

module.exports = MainWindow