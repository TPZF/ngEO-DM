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
		this._topWindow = myTopWindow;
		this._mainWindow = myMainWindow;
		this._downloadItems = [];
		this._downloadUrls = [];
		this._downloadRequests = [];
		this.shibb = null;
	}

	startDownload(myUrl) {
		let _item = this._getDownloadItemByUrl(myUrl);
		if (_item !== null && _item.isPaused()) {
			logger.debug('downloadHandler.startDownload item not null > resume it !');
			item.resume();
		} else {
			logger.debug('downloadHandler.startDownload item null > download it !');
			logger.debug('url: ' + myUrl);
			this._topWindow._bw.webContents.downloadURL(myUrl);
		}
	}

	startEcpDownload(myUrl) {

		let _that = this;

		logger.debug('downloadHandler.startEcpDownload(' + myUrl + ')');
		// logger.debug('downloadHandler.startEcpDownload settings.get(username):' + settings.get('username') + '');
		// logger.debug('downloadHandler.startEcpDownload settings.get(username):' + settings.get('password') + '');
		let _options;
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
			_options = {
				credentials: {
					username: settings.get('username'),
					password: settings.get('password')
				},
				path: settings.get('downloadPath') + '/',
				configuration: configuration.getConf(),
				url: myUrl
			};
			ecp.downloadURL(_options)
				.then((_resp) => {
					logger.debug('downloadHandler _resp' + _resp);
					_that.shibb = _resp.request.headers['Cookie'];
					_that._startDownloadFile(_resp.url, _resp.request);
				})
				.catch((_err) => {
					logger.debug('downloadHandler downloadError _err' + _err);
					_that._mainWindow._bw.webContents.send('downloadError', {
						url: _err.url,
						errorMsg: _err.errorMsg
					});
				})
		}
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
		if (this._downloadItems) {
			logger.debug('downloadHandler._getDownloadItemByUrl items.length ' + this._downloadItems.length);
			this._downloadItems.forEach((_item) => {
				if (_item.getURLChain()[0] === myUrl) {
					_result = _item;
				}
			});
		}
		logger.debug('downloadHandler._getDownloadItemByUrl ' + _result);
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
		if (this._downloadItems) {
			logger.debug('downloadHandler._delDownloadItemByUrl old array ' + this._downloadItems.length);
			this._downloadItems.forEach((_item) => {
				// getURLChain()[0] is the first url called
				if (_item.getURLChain()[0] !== myUrl) {
					_newDownloadItems.push(_item);
				}
			});
		}
		this._downloadItems = _newDownloadItems;
		logger.debug('downloadHandler._delDownloadItemByUrl new array ' + this._downloadItems.length);
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
		if (this._downloadUrls) {
			logger.debug('downloadHandler._getDownloadByUrl items.length ' + this._downloadUrls.length);
			this._downloadUrls.forEach((_downloadUrl) => {
				if (_downloadUrl.url === myUrl) {
					_result = _downloadUrl;
				}
			});
		}
		logger.debug('downloadHandler._getDownloadByUrl ' + _result);
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
		if (this._downloadUrls) {
			logger.debug('downloadHandler._delDownloadByUrl old array ' + this._downloadUrls.length);
			this._downloadUrls.forEach((_downloadUrl) => {
				// getURLChain()[0] is the first url called
				if (_downloadUrl.url !== myUrl) {
					_newDownloadUrls.push(_downloadUrl);
				}
			});
		}
		this._downloadUrls = _newDownloadUrls;
		logger.debug('downloadHandler._delDownloadByUrl new array ' + this._downloadUrls.length);
	}

	/**
	 *
	 * @param {*} myUrl
	 * @param {*} myRequest
	 */
	_startDownloadFile(myUrl, myRequest) {
		logger.debug('downloadHandler.startDownloadFile');
		let _item = this._getDownloadByUrl(myUrl);
		if (_item !== null && _item.isPaused) {
			logger.debug('downloadHandler.startDownloadFile item already exists > resume it !');
			this._resumeDownloadUrl(_item);
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
			this._downloadUrls.push(_downloadUrl);
			logger.debug(this._downloadUrls.length);
			this._startDownloadUrl(_downloadUrl);
		}
	}

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

		this._downloadRequests.push(_req);

		_req.on('error', (e) => {
			if (e.code !== 'HPE_INVALID_CONSTANT') {
				logger.error('downloadHandler._startDownloadUrl error ' + JSON.stringify(e));
				if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
					_that._mainWindow.getBrowserWindow().webContents.send('downloadError', {
						url: myDownloadUrl.url,
						errorMsg: e
					});
				}
			}
		});
		_req.end();
	}

	/**
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
		logger.debug('downloadHandler._saveRessource _filePath:' + _filePath);

		let _wstream = fs.createWriteStream(_filePath + '.filepart');

		let _bytesDone = 0;
		let _bytesTotal = this._getSizeFromHeaders(myResponse);
		logger.debug('downloadHandler._saveRessource bytes total:' + _bytesTotal);

		myResponse.on('data', function (_chunk) {
			_wstream.write(_chunk);
			_bytesDone += _chunk.byteLength;
			//myOptions.logger.debug('ECP ' + _bytesDone + ' bytes done');
			if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
				_that._mainWindow.getBrowserWindow().webContents.send('downloadUpdated', {
					url: myDownloadUrl.url,
					total: _bytesTotal,
					received: _bytesDone
				});
			}
		})
		myResponse.on('end', function () {
			_wstream.end();
			logger.debug('downloadHandler._saveRessource end');
			if (_that._mainWindow && _that._mainWindow.getBrowserWindow()) {
				_that._mainWindow.getBrowserWindow().webContents.send('downloadCompleted', {
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
			_that._delDownloadByUrl(myDownloadUrl.url);
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

}

module.exports = DownloadHandler;
