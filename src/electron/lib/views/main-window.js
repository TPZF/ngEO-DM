'use strict';

const { BrowserWindow, ipcMain, shell } = require('electron');
const https = require('https');
const fs = require('fs');
const path = require('path');
const URL = require('url');

const settings = require('electron-settings');
const configuration = require('./../handlers/configuration');

const ecp = require('./../ecp');

const rootPath = path.join(__dirname, './../..');
const assetsPath = path.join(rootPath, 'vendor/assets');

class MainWindow {

	constructor(myTopWindow, myLogger, myIsDev) {
		this.topWindow = myTopWindow;
		this.mainWindow = null;
		this.logger = myLogger;
		this.isDev = myIsDev;
		this.downloadItems = [];
		this.downloadUrls = [];
		this.createWindow();
	}

	createWindow() {

		this.logger.debug('MainWindow.createWindow');
		// Initialize the window to our specified dimensions
		this.mainWindow = new BrowserWindow({
			icon: path.join(assetsPath, 'ngeo-window.png'),
			parent: this.topWindow.topWindow,
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
		return this.mainWindow;
	}

	initWindowEvents() {
		// Show window when ready to show
		this.mainWindow.once('ready-to-show', () => {
			this.logger.debug('MainWindow event ready-to-show');
			this.mainWindow.show();
		});

		// Clear out the main window when the app is closed
		this.mainWindow.on('closed', () => {
			this.logger.debug('MainWindow event closed');
			this.mainWindow = null;
		});

	}

	load() {

		this.logger.debug('MainWindow.load');

		// Tell Electron where to load the entry point from
		this.mainWindow.loadURL("file://" + rootPath + "/index.html");

		// Open the DevTools.
		if (this.isDev) {
			this.logger.debug('MainWindow in dev mode > openDevTools');
			this.mainWindow.webContents.openDevTools();
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
		// download DAR with ECP
		// -------------------------------------------
		// start
		ipcMain.on('startECPDownloadDar', (event, myDar) => {
			_that.logger.debug('ipcMain.startECPDownloadDar');
			let _options = {
				credentials: {
					username: settings.get('username'),
					password: settings.get('password')
				},
				path: settings.get('downloadPath') + '/',
				configuration: configuration.getConf(this.isDev),
				logger: _that.logger
			};
			myDar.productStatuses.forEach((product) => {
				_options.url = product.productURL;
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
		});

		// -------------------------------------------
		// download file
		// -------------------------------------------
		//	start
		ipcMain.on('startDownloadFile', (event, myUrlFile) => {
			_that._startDownloadFile(myUrlFile);
		});
		// pause
		ipcMain.on('pauseDownloadFile', (event, myUrlFile) => {
			_that.logger.debug('ipcMain.pauseDownloadFile');
			let _item = _that._getDownloadItemByUrl(myUrlFile);
			if (_item !== null) {
				_that.logger.debug('ipcMain.cancelDownloadFile item not null > pause it !');
				_item.pause();
			}
		});
		// cancel
		ipcMain.on('cancelDownloadFile', (event, myUrlFile) => {
			_that.logger.debug('ipcMain.cancelDownloadFile');
			let _item = _that._getDownloadItemByUrl(myUrlFile);
			if (_item !== null) {
				_that.logger.debug('ipcMain.cancelDownloadFile item not null > cancel it !');
				_that._delDownloadItemByUrl(myUrlFile);
				_item.cancel();
			}
		});

		// -------------------------------------------
		// Download DAR
		// -------------------------------------------
		// start
		ipcMain.on('startDownloadDar', (event, myDar) => {
			_that.logger.debug('ipcMain.startDownloadDar');
			var wc = _that.topWindow.webContents;
			myDar.productStatuses.forEach((product) => {
				let item = _that._getDownloadItemByUrl(product.productURL);
				if (item !== null && item.isPaused()) {
					_that.logger.debug('ipcMain.startDownloadDar item not null > resume it !');
					item.resume();
				} else {
					_that.logger.debug('ipcMain.startDownloadDar item null > download it !');
					_that.logger.debug('url: ' + product.productURL);

					wc.downloadURL(product.productURL);
				}
			});
		});
		// pause
		ipcMain.on('pauseDownloadDar', (event, myDar) => {
			_that.logger.debug('ipcMain.pauseDownloadDar');
			myDar.productStatuses.forEach((product) => {
				let item = _that._getDownloadItemByUrl(product.productURL);
				if (item !== null) {
					_that.logger.debug('ipcMain.cancelDownloadDar item not null > pause it !');
					item.pause();
				}
			});
		});
		// cancel
		ipcMain.on('cancelDownloadDar', (event, myDar) => {
			_that.logger.debug('ipcMain.cancelDownloadDar');
			myDar.productStatuses.forEach((product) => {
				let item = _that._getDownloadItemByUrl(product.productURL);
				if (item !== null) {
					_that.logger.debug('ipcMain.cancelDownloadDar item not null > cancel it !');
					item.cancel();
				}
			});
		});
		// -------------------------------------------
		//	settings
		// -------------------------------------------
		ipcMain.on('settings-choosepath', (event) => {
			let myPaths = dialog.showOpenDialog(this.mainWindow, {
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
			_that.logger.debug('ipcMain.settings-set');
			_that.logger.debug('ipcMain.settings-set key=' + key);
			_that.logger.debug('ipcMain.settings-set value=' + value);
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
			this.logger.debug('_getDownloadItemByUrl items.length ' + this.downloadItems.length);
			this.downloadItems.forEach((_item) => {
				if (_item.getURLChain()[0] === myUrl) {
					_result = _item;
				}
			});
		}
		this.logger.debug('_getDownloadItemByUrl ' + _result);
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
			this.logger.debug('_delDownloadItemByUrl old array ' + this.downloadItems.length);
			this.downloadItems.forEach((_item) => {
				// getURLChain()[0] is the first url called
				if (_item.getURLChain()[0] !== myUrl) {
					_newDownloadItems.push(_item);
				}
			});
		}
		this.downloadItems = _newDownloadItems;
		this.logger.debug('_delDownloadItemByUrl new array ' + this.downloadItems.length);
	}

	_startDownloadFile(myUrl, myRequest) {
		this.logger.debug('ipcMain.startDownloadFile');
		let _item = this._getDownloadByUrl(myUrl);
		if (_item !== null && _item.isPaused) {
			this.logger.debug('ipcMain.startDownloadFile item already exists > resume it !');
			this._resumeDownloadUrl(_item);
		} else {
			this.logger.debug('ipcMain.startDownloadFile item null > download it !');
			this.logger.debug(myRequest);
			if (typeof myRequest === 'undefined') {
				let url = URL.parse(myUrl);
				myRequest = {
					host: url.host,
					port: url.port == null ? 443 : url.port,
					path: url.pathname,
					method: 'GET'
				};
			}
			let downloadUrl = {
				url: myUrl,
				request: myRequest
			};
			this.downloadUrls.push(downloadUrl);
			this.logger.debug(this.downloadUrls.length);
			this._startDownloadUrl(downloadUrl);
		}
	}

	_startDownloadUrl(myDownloadUrl) {

		let _that = this;

		this.logger.debug('_startDownloadUrl ' + myDownloadUrl.url);
		// request
		let _req = https.request(myDownloadUrl.request, (_resp) => {
			_that._saveRessource(_resp, myDownloadUrl);
		});
		_req.on('error', (e) => {
			if (e.code !== 'HPE_INVALID_CONSTANT') {
				_that.logger.error('_startDownloadUrl error ' + JSON.stringify(e));
				_that.mainWindow.webContents.send('downloadError', {
					url: myDownloadUrl.url,
					errorMsg: e
				});
			}
		});
		_req.end();
	}

	_resumeDownloadUrl(myDownloadUrl) {
		this.logger.debug('_resumeDownloadUrl ' + myDownloadUrl.url);
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
			this.logger.debug('_getDownloadByUrl items.length ' + this.downloadUrls.length);
			this.downloadUrls.forEach((_downloadUrl) => {
				if (_downloadUrl.url === myUrl) {
					_result = _downloadUrl;
				}
			});
		}
		this.logger.debug('_getDownloadByUrl ' + _result);
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
			this.logger.debug('_delDownloadByUrl old array ' + this.downloadUrls.length);
			this.downloadUrls.forEach((_downloadUrl) => {
				// getURLChain()[0] is the first url called
				if (_downloadUrl.url !== myUrl) {
					_newDownloadUrls.push(_downloadUrl);
				}
			});
		}
		this.downloadUrls = _newDownloadUrls;
		this.logger.debug('_delDownloadByUrl new array ' + this.downloadUrls.length);
	}

	/**
	 * @function _saveRessource
	 * @param {object} myResponse
	 * @param {object} myDownloadUrl
	 * @private
	 */
	_saveRessource(myResponse, myDownloadUrl) {

		this.logger.debug('----------------------------------------------------------------------');
		this.logger.debug('_saveRessource');
		this.logger.debug('----------------------------------------------------------------------');
		this.logger.debug('headers:\n' + JSON.stringify(myResponse.headers));

		let _that = this;

		let _fileName = 'resource.txt';

		let _disposition = myResponse.headers['Content-Disposition'];
		if (typeof _disposition === 'undefined') {
			_disposition = myResponse.headers['content-disposition'];
		}
		if (typeof _disposition !== 'undefined') {
			// inline; filename="file.txt"
			const _filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
			var _matches = _filenameRegex.exec(_disposition);
			if (_matches != null && _matches[1]) {
				_fileName = _matches[1].replace(/['"]/g, '');
			}
		}
		let _filePath = settings.get('downloadPath') + '/' + _fileName;
		this.logger.debug('_filePath:' + _filePath);

		let _wstream = fs.createWriteStream(_filePath);

		let _bytesDone = 0;
		let _bytesTotal = parseInt(myResponse.headers['content-length']);
		this.logger.debug('ECP bytes total:' + _bytesTotal);

		myResponse.on('data', function (_chunk) {
			_wstream.write(_chunk);
			_bytesDone += _chunk.byteLength;
			//myOptions.logger.debug('ECP ' + _bytesDone + ' bytes done');
			_that.mainWindow.webContents.send('downloadUpdated', {
				url: myDownloadUrl.url,
				total: _bytesTotal,
				received: _bytesDone
			});
		})
		myResponse.on('end', function () {
			_wstream.end();
			_that.logger.debug('ECP end');
			_that.mainWindow.webContents.send('downloadCompleted', {
				url: myDownloadUrl.url,
				path: _filePath
			});
		})

	}

}

module.exports = MainWindow