'use strict';
const http = require('http');
const https = require('https');
const fs = require('fs');
const URL = require('url');

const notifier = require('electron-notifications');
const settings = require('electron-settings');

const configuration = require('../handlers/configuration');
const ecp = require('../ecp');

const path = require('path');
const rootPath = path.join(__dirname, '../..');
const assetsPath = path.join(rootPath, 'webapp/assets');
const logger = require('../utils/logger');

class DownloadHandler {

	constructor(myTopWindow, myMainWindow) {
		this.topWindow = myTopWindow;
		this.mainWindow = myMainWindow;
		this._downloads = [];
		this.shibb = null;
	}

	/**
	 * Try do download with DownloadItem provided by electron
	 *
	 * @function startDownload
	 * @param {string} myUrl
	 */
	startDownload(myUrl, myDarName) {
		logger.debug('downloadHandler.startDownload(' + myUrl + ', ' + myDarName + ')');
		// set path
		let _path = settings.get('downloadPath') + '/' + this._cleanName(myDarName);
		this._createFolderForPath(_path);
		// set download object
		let _download = {
			url: myUrl,
			darName: myDarName,
			type: 'DownloadItem',
			status: 'progressing',
			pathFolder: _path,
			created: new Date().getTime()
		};
		this._addInDownloads(_download); // only if not exists in _downloads array
		_download = this._getInDownloads(myUrl, myDarName);
		if (typeof _download.item !== 'undefined') {
			if (_download.status === 'paused') {
				logger.debug('downloadHandler.startDownload item is paused > resume !');
				_download.status = 'progressing';
				// @see top-window.js - will-download
				_download.item.resume();
				return;
			}
			if (_download.status === 'error') {
				logger.debug('downloadHandler.startDownload item is on error > retry !');
				_download.status = 'progressing';
				// @see top-window.js - will-download
				this.topWindow.getBrowserWindow().webContents.downloadURL(myUrl);
				return;
			}
			return;
		}
		if (typeof _download.request !== 'undefined') {
			logger.debug('downloadHandler.startDownload request > retry !');
			_download.status = 'progressing';
			this._startDownloadFile(myUrl, myDarName, _download.request);
			return;
		}
		logger.debug('downloadHandler.startDownload item/request null > download it !');
		_download.status = 'progressing';
		// @see top-window.js - will-download
		this.topWindow.getBrowserWindow().webContents.downloadURL(myUrl);
	}

	stopDownload(myUrl, myDarName) {
		logger.debug('######### downloadHandler.stopDownload(' + myUrl + ', ' + myDarName + ')');
		// find in _downloads
		let _download = this._getInDownloads(myUrl, myDarName);
		// if not found else end !
		if (_download === null) return;
		// find if already stopped
		let setStop = false;
		logger.debug('######### downloadHandler.stopDownload status=' + _download.status);
		if (typeof _download.status === 'undefined') {
			_download.status = 'paused';
			setStop = true;
		} else {
			setStop = (_download.status === 'progressing');
		}
		logger.debug('######### downloadHandler.stopDownload setStop=' + setStop);
		// if already cancelled else end !
		if (!setStop) return;
		logger.debug('######### downloadHandler.stopDownload _download.type=' + _download.type);
		_download.status = 'paused';
		if (_download.type === 'DownloadItem') {
			if (typeof _download.item !== 'undefined') {
				logger.debug('######### downloadHandler.stopDownload item.pause');
				_download.item.pause();
			}
		} else if (_download.type === 'DownloadUrl') {
			logger.debug('######### downloadHandler.stopDownload _download.request=' + _download.request);
			if (typeof _download.requestXhr !== 'undefined') {
				logger.debug('######### downloadHandler.stopDownload requestXhr.abort');
				_download.requestXhr.abort();
			}
		} else {
			return;
		}
		if (this.mainWindow && this.mainWindow.getBrowserWindow()) {
			this.mainWindow.getBrowserWindow().webContents.send('downloadPaused', {
				url: myUrl
			});
		}
	}

	cancelDownload(myUrl, myDarName) {
		// find in _downloads
		let _download = this._getInDownloads(myUrl, myDarName);
		// if not found else end !
		if (_download === null) return;
		// if already paused
	}

	/**
	 * start a download via ECP
	 * @function startEcpDownload
	 * @param {string} myUrl
	 */
	startEcpDownload(myUrl, myDarName) {

		let _that = this;

		logger.debug('downloadHandler.startEcpDownload(' + myUrl + ',' + myDarName +')');

		let _download = this._getInDownloads(myUrl, myDarName);
		_download.type = 'DownloadUrl';
		// logger.debug('downloadHandler.startEcpDownload settings.get(username):' + settings.get('username') + '');
		// logger.debug('downloadHandler.startEcpDownload settings.get(username):' + settings.get('password') + '');
		let _options;
		// if shibb then download file with cookie in header
		if (this.shibb) {
			let _url = URL.parse(myUrl);
			_options = {
				host: _url.host,
				port: _url.protocol.indexOf('https') > -1 ? '443' : '80',
				path: _url.pathname + (_url.search == null ? '' : _url.search),
				method: 'GET',
				headers: {
					'Content-Type': 'application/vnd.paos+xml',
					'Cookie': this.shibb
				}
			};
			logger.debug('downloadHandler.startEcpDownload shibb _options:' + _options);
			this._startDownloadFile(myUrl, myDarName, _options);
		} else {
			// put credentials, path, configuration, logger and url in options
			_options = {
				credentials: {
					username: settings.get('username'),
					password: settings.get('password')
				},
				path: settings.get('downloadPath') + '/',
				configuration: configuration.getConf(),
				url: myUrl
			};
			// downloadURL via ECP
			ecp.downloadURL(_options)
				.then((_resp) => {
					logger.debug('downloadHandler _resp' + _resp);
					_that.shibb = _resp.request.headers['Cookie'];
					let _download = this._getInDownloads(myUrl, myDarName);
					logger.debug(_download.status);
					if (_download.status === 'progressing') {
						_that._startDownloadFile(_resp.url, myDarName, _resp.request);
					}
				})
				.catch((_err) => {
					logger.debug('downloadHandler downloadError _err' + _err);
					_that.mainWindow.getBrowserWindow().webContents.send('downloadError', {
						url: _err.url,
						errorMsg: _err.errorMsg
					});
				})
		}
	}

	/**
	 * Start download file with myUrl
	 *
	 * @function _startDownloadFile
	 * @param {string} myUrl
	 * @param {string} myDarName
	 * @param {object} myRequest
	 */
	_startDownloadFile(myUrl, myDarName, myRequest) {
		logger.debug('downloadHandler.startDownloadFile');
		let _download = this._getInDownloads(myUrl, myDarName);
		logger.debug('downloadHandler.startDownloadFile _download.status=' + _download.status);
		if (_download !== null) {
			if (_download.status === 'paused') return;
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
			let _downloadUrl = {
				url: myUrl,
				darName: myDarName,
				request: myRequest
			};
			this._startDownloadUrl(_downloadUrl);
		}
	}

	/**
	 * Start download for myDownloadUrl object
	 *
	 * @function _startDownloadUrl
	 * @param {object} myDownloadUrl
	 */
	_startDownloadUrl(myDownloadUrl) {

		let _that = this;

		logger.debug('downloadHandler._startDownloadUrl ' + myDownloadUrl.url);
		// request
		let _req;
		if (myDownloadUrl.url.indexOf('https') === 0) {
			_req = https.request(myDownloadUrl.request, (_resp) => {
				_that._saveRessource(_resp, myDownloadUrl);
			});
		} else {
			_req = http.request(myDownloadUrl.request, (_resp) => {
				_that._saveRessource(_resp, myDownloadUrl);
			});
		}
		let _download = this._getInDownloads(myDownloadUrl.url, myDownloadUrl.darName);
		_download.requestXhr = _req;
		_download.request = myDownloadUrl.request;

		_req.on('error', (e) => {
			if (e.code === 'HPE_INVALID_CONSTANT') {
				return;
			}
			if (e.code === 'ECONNRESET') {
				// abort called by stopDownload
				return;
			}
			_download.status = 'error';
			logger.error('downloadHandler._startDownloadUrl error ' + JSON.stringify(e));
			if (_that.mainWindow && _that.mainWindow.getBrowserWindow()) {
				_that.mainWindow.getBrowserWindow().webContents.send('downloadError', {
					url: myDownloadUrl.url,
					errorMsg: e
				});
			}
		});
		_req.end();
	}

	/**
	 * Save to filePath
	 * @function _saveRessource
	 * @param {object} myResponse
	 * @param {object} myDownloadUrl
	 * @private
	 */
	_saveRessource(myResponse, myDownloadUrl) {

		logger.debug('downloadHandler._saveRessource headers:\n' + JSON.stringify(myResponse.headers));

		let _that = this;

		// get download object
		let _download = _that._getInDownloads(myDownloadUrl.url, myDownloadUrl.darName);
		_download.status = 'progressing';

		let _fileName = this._getFileNameFromHeaders(myResponse, myDownloadUrl);
		let _filePath = _download.pathFolder + '/' + _fileName;
		// TODO make it better
		if (fs.existsSync(_filePath)) {
			let _newFileName = _fileName.substring(0, _fileName.lastIndexOf('.')) + '(' + new Date().getTime() + ').' + _fileName.substring(_fileName.lastIndexOf('.') + 1);
			_fileName = _newFileName;
			_filePath = _download.pathFolder + '/' + _fileName;
		}
		logger.debug('downloadHandler._saveRessource _filePath:' + _filePath);

		let _wstream = fs.createWriteStream(_filePath + '.filepart');

		let _bytesDone = 0;
		let _bytesTotal = this._getSizeFromHeaders(myResponse);
		logger.debug('downloadHandler._saveRessource bytes total:' + _bytesTotal);

		myResponse.on('data', function (_chunk) {
			_wstream.write(_chunk);
			_bytesDone += _chunk.byteLength;
			//myOptions.logger.debug('ECP ' + _bytesDone + ' bytes done');
			if (_that.mainWindow && _that.mainWindow.getBrowserWindow()) {
				_that.mainWindow.getBrowserWindow().webContents.send('downloadUpdated', {
					url: myDownloadUrl.url,
					total: _bytesTotal,
					received: _bytesDone
				});
			}
		})
		myResponse.on('end', function () {
			_wstream.end();
			logger.debug('downloadHandler._saveRessource end');
			if (_bytesDone === _bytesTotal) {
				_download.status = 'completed';
				if (_that.mainWindow && _that.mainWindow.getBrowserWindow()) {
					_that.mainWindow.getBrowserWindow().webContents.send('downloadCompleted', {
						url: myDownloadUrl.url,
						path: _filePath
					});
				} else {
					notifier.notify('Download completed', {
						icon: path.join(assetsPath, 'ngeo-window.png'),
						message: 'The file ' + _fileName + ' is completed !',
						buttons: ['OK']
					});
				}
				fs.renameSync(_filePath + '.filepart', _filePath);
				_that._delInDownloads(myDownloadUrl.url);
			}
		})

	}

	/**
	 * Retieve fileName from headers first, and if not found from url
	 *
	 * @function _getFileNameFromHeaders
	 * @param {object} myResponse
	 * @param {object} myDownloadUrl
	 */
	_getFileNameFromHeaders(myResponse, myDownloadUrl) {
		let _fileName = '';

		let _disposition;
		for (let _head in myResponse.headers) {
			if (_head.toLowerCase() === 'content-disposition') {
				_disposition = myResponse.headers[_head];
			}
		}
		if (typeof _disposition !== 'undefined') {
			// inline; filename="file.txt"
			const _filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
			let _matches = _filenameRegex.exec(_disposition);
			if (_matches != null && _matches[1]) {
				_fileName = _matches[1].replace(/['"]/g, '');
			}
		}
		if (_fileName === '') {
			// extract filename from request pathname
			let _pathName = myDownloadUrl.request.path;
			_fileName = _pathName.substring(_pathName.lastIndexOf('/') + 1);
		}
		if (_fileName === '') {
			_fileName = 'resource.txt';
		}
		return _fileName;
	}

	/**
	 * Retrieve content length from response
	 *
	 * @function _getSizeFromHeaders
	 * @param {object} myResponse
	 * @returns {integer}
	 */
	_getSizeFromHeaders(myResponse) {
		let _size = 0;
		for (let _head in myResponse.headers) {
			if (_head.toLowerCase() === 'content-length') {
				_size = parseInt(myResponse.headers[_head]);
			}
		}
		return _size;
	}

	_addInDownloads(myDownload) {
		// logger.debug('downloadHandler._addInDownloads');
		if (this._getInDownloads(myDownload.url, myDownload.darName) === null) {
			this._downloads.push(myDownload);
		}
		// logger.debug('downloadHandler._addInDownloads length=' + this._downloads.length);
	}

	_getInDownloads(myUrl, myDarName) {
		// logger.debug('downloadHandler._getInDownloads');
		let _result = null;
		this._downloads.forEach((_elem) => {
			if (_elem.url === myUrl && _elem.darName === myDarName) {
				_result = _elem;
			}
		});
		// logger.debug('downloadHandler._getInDownloads return ' + _result);
		return _result;
	}

	_getLastInDownloads(myUrl) {
		// logger.debug('downloadHandler._getInDownloads');
		let _result = null;
		let _lastDate = new Date().getTime() - 1000*60*60*24*30;
		this._downloads.forEach((_elem) => {
			if (_elem.url === myUrl) {
				if (_elem.created >= _lastDate) {
					_result = _elem;
					_lastDate = _elem.created;
				}
			}
		});
		// logger.debug('downloadHandler._getInDownloads return ' + _result);
		return _result;
	}

	_delInDownloads(myUrl, myDarName) {
		// logger.debug('downloadHandler._delInDownloads');
		// logger.debug('downloadHandler._delInDownloads before length=' + this._downloads.length);
		let _newDownloads = [];
		this._downloads.forEach((_elem) => {
			if (_elem.url !== myUrl || _elem.darName !== myDarName) {
				_newDownloads.push(_elem);
			}
		});
		this._downloads = _newDownloads;
		// logger.debug('downloadHandler._delInDownloads after length=' + this._downloads.length);
	}

	_createFolderForPath(myPath) {
		fs.access(myPath, (err) => {
			if (err && err.code === 'ENOENT') {
				fs.mkdir(myPath, (err) => {
					if (err) {
						logger.error('Cannot create directory for download : ' + myPath);
					}
				});
			}
		});
	}

	_cleanName(myName) {
		myName = myName.replace(/\s+/gi, '-'); // Replace white space with dash
		return myName.replace(/[^a-zA-Z0-9\-\_\.]/gi, ''); // Strip any special charactere
	}

}

module.exports = DownloadHandler;
