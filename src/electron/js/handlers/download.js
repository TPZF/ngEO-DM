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
	startDownload(myUrl) {
		logger.debug('downloadHandler.startDownload(' + myUrl + ')');
		this._addInDownloads({ url: myUrl, type: 'DownloadItem' });
		let _download = this._getInDownloads(myUrl);
		if (typeof _download.item !== 'undefined' && _download.item.isPaused()) {
			logger.debug('downloadHandler.startDownload item not null > resume it !');
			_download.item.resume();
		} else {
			logger.debug('downloadHandler.startDownload item null > download it !');
			logger.debug('url: ' + myUrl);
			// @see top-window.js - will-download
			this.topWindow.getBrowserWindow().webContents.downloadURL(myUrl);
		}
	}

	pauseDownload(myUrl) {
		// find in _downloads
		let _download = this._getInDownloads(myUrl);
		// if not found else end !
		if (_ind === -1) return;
		// if already paused
		let setPaused = false;
		if (!this._downloads[_ind].isPaused) {
			this._downloads[_ind].isPaused = true;
			setPaused = true;
		}
		if (!setPaused) return;
		logger.debug('downloadHandler.cancelDownload pause it');
		/*
		this.logger.debug('downloadHandler.pauseDownload setPause=' + setPause);
		let _item = null;
		let _start = new Date();
		let _end = new Date();
		while (_item === null && (_end.getTime() - _start.getTime() < 1000)) {
			_item = this._getDownloadItemByUrl(myUrl);
			_item = this._getDownloadByUrl(myUrl);
			_end = new Date();
		}
		if (_item === null) {
			return;
		}
		if (!_item.isPaused()) {
			item.pause();
		} else {
			if (!_item.isOnPaused) {
				this._downloadRequests.forEach((dR) => {
					if (dR.downloadUrl.url === myUrl) {
						_item.isOnPaused = true;
						dR.request.abort();
					}
				});
			}
		}
		*/
	}

	cancelDownload(myUrl) {
		logger.debug('######### downloadHandler.cancelDownload(' + myUrl + ')');
		// find in _downloads
		let _download = this._getInDownloads(myUrl);
		// if not found else end !
		if (_download === null) return;
		// find if already cancelled
		let setCancel = false;
		logger.debug('######### downloadHandler.cancelDownload isCancelled=' + _download.isCancelled);
		if (typeof _download.isCancelled === 'undefined') {
			_download.isCancelled = true;
			setCancel = true;
		} else {
			setCancel = _download.isCancelled;
		}
		logger.debug('######### downloadHandler.cancelDownload setCancel=' + setCancel);
		// if already cancelled else end !
		if (!setCancel) return;
		logger.debug('######### downloadHandler.cancelDownload cancel it' + _download.type);
		if (_download.type === 'DownloadItem') {
			if (typeof _download.item !== 'undefined') {
				logger.debug('######### downloadHandler.cancelDownload item.cancel');
				_download.item.cancel();
			}
		} else if (_download.type === 'DownloadUrl') {
			if (typeof _download.request !== 'undefined') {
				logger.debug('######### downloadHandler.cancelDownload request.abort');
				_download.request.abort();

			}
		} else {
			return;
		}
		this._delInDownloads(myUrl);

	}

	/**
	 * start a download via ECP
	 * @function startEcpDownload
	 * @param {string} myUrl
	 */
	startEcpDownload(myUrl) {

		let _that = this;

		logger.debug('downloadHandler.startEcpDownload(' + myUrl + ')');

		let _download = this._getInDownloads(myUrl);
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
			this._startDownloadFile(myUrl, _options);
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
					if (!_download.isCancelled) {
						_that._startDownloadFile(_resp.url, _resp.request);
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
	 * @param {object} myRequest
	 */
	_startDownloadFile(myUrl, myRequest) {
		logger.debug('downloadHandler.startDownloadFile');
		let _download = this._getInDownloads(myUrl);
		if (_download !== null) {
			if (_download.isCancelled) return;
			if (_download.isPaused) {
				logger.debug('downloadHandler.startDownloadFile item already exists > resume it !');
				//this._resumeDownloadUrl(_item);
			} else {
				logger.debug('downloadHandler.startDownloadFile item null > download it !');
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
				let _downloadUrl = {
					url: myUrl,
					request: myRequest
				};
				this._startDownloadUrl(_downloadUrl);
			}
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
		logger.debug('downloadHandler._startDownloadUrl ' + JSON.stringify(myDownloadUrl.request));
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
		let _download = this._getInDownloads(myDownloadUrl.url);
		_download.request = _req;

		_req.on('error', (e) => {
			if (e.code !== 'HPE_INVALID_CONSTANT') {
				logger.error('downloadHandler._startDownloadUrl error ' + JSON.stringify(e));
				if (_that.mainWindow && _that.mainWindow.getBrowserWindow()) {
					_that.mainWindow.getBrowserWindow().webContents.send('downloadError', {
						url: myDownloadUrl.url,
						errorMsg: e
					});
				}
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

		let _fileName = this._getFileNameFromHeaders(myResponse, myDownloadUrl);
		let _filePath = settings.get('downloadPath') + '/' + _fileName;
		// TODO make it better
		if (fs.existsSync(_filePath)) {
			let _newFileName = _fileName.substring(0, _fileName.lastIndexOf('.')) + '(' + new Date().getTime() + ').' + _fileName.substring(_fileName.lastIndexOf('.') + 1);
			_fileName = _newFileName;
			_filePath = settings.get('downloadPath') + '/' + _fileName;
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
		if (this._getInDownloads(myDownload.url) === null) {
			this._downloads.push(myDownload);
		}
		// logger.debug('downloadHandler._addInDownloads length=' + this._downloads.length);
	}

	_getInDownloads(myUrl) {
		// logger.debug('downloadHandler._getInDownloads');
		let _result = null;
		this._downloads.forEach((_elem) => {
			if (_elem.url === myUrl) {
				_result = _elem;
			}
		});
		// logger.debug('downloadHandler._getInDownloads return ' + _result);
		return _result;
	}

	_delInDownloads(myUrl) {
		// logger.debug('downloadHandler._delInDownloads');
		// logger.debug('downloadHandler._delInDownloads before length=' + this._downloads.length);
		let _newDownloads = [];
		this._downloads.forEach((_elem) => {
			if (_elem.url !== myUrl) {
				_newDownloads.push(_elem);
			}
		});
		this._downloads = _newDownloads;
		// logger.debug('downloadHandler._delInDownloads after length=' + this._downloads.length);
	}

}

module.exports = DownloadHandler;
