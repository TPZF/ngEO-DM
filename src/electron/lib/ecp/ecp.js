const electron = require('electron');
const { EventEmitter } = require('events');

const https = require('https');
const url = require('url');
const fs = require('fs');
const btoa = require('btoa');

const log = require('electron-log');
log.transports.file.level = 'all';
log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
log.transports.file.maxSize = 5 * 1024 * 1024;

const SP_HOST = 'eodata-service.user.eocloud.eu';
const SP_ECP_ENDPOINT = '/Shibboleth.sso/SAML2/ECP';
const IDP_HOST = 'eodata-idp.user.eocloud.eu';
const IDP_ECP_ENDPOINT = '/idp/profile/SAML2/SOAP/ECP';
const HTTPS_PORT = 443;

const HEADER_START_STRING = '<S:Header>';
const HEADER_END_STRING = '</S:Header>';
const RS_START_STRING = '<ecp:RelayState';
const RS_END_STRING = '</ecp:RelayState>';
const SOAP_ENVELOPE_START_STRING = "<soap11:Envelope";
const ACS_START_STRING = '<ecp:Response AssertionConsumerServiceURL';
const REQ_AUTHENTICATED_START_STRING = '<ecp:RequestAuthenticated';
const HTTPS_STRING = 'https://';

class ECP extends EventEmitter {

	constructor() {
		super();
	}

	/**
	 * Call myProductUrl with specific header,
	 * in order to get soap envelop for next request
	 *
	 * @function _getSoapForUrl
	 * @param {string} myProductUrl
	 * @param {object} myWc
	 * @param {string} myCurrentPath
	 * @param {string} myCredentials
	 * @returns
	 * @private
	 */
	_getSoapForUrl(myProductUrl, myWc, myCurrentPath, myCredentials) {

		let _that = this;

		console.log('----------------------------------------------------------------------');
		console.log('_getSoapForUrl');
		console.log('----------------------------------------------------------------------');
		log.debug('ECP _getSoapForUrl');

		let _url = url.parse(myProductUrl);

		// options
		let _options = {
			host: _url.host,
			port: _url.port,
			path: _url.path,
			method: 'GET',
			headers: {
				Accept: 'text/html; application/vnd.paos+xml',
				PAOS:'ver=\"urn:liberty:paos:2003-08\";\"urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp\"'
			}
		}

		// request
		let _req = https.request(_options, (_resp) => {
			let _body = '';
			_resp.on('data', (_chunk) => {
				_body += _chunk;
			});
			_resp.on('end', () => {
				_that._postBasicAuthenticationWithSoapOnIdP(_resp, _body, myProductUrl, myWc, myCurrentPath, myCredentials);
			});
		});
		_req.on('error', (e) => {
			console.log('ECP _getSoapForUrl error ' + e);
			log.error('ECP _getSoapForUrl error ' + e);
			myWc.send('downloadError', {
				url: myProductUrl,
				errorMsg: e
			});
		});
		_req.end();
	}

	/**
	 * Create and send the authentication request to the IdP
	 *
	 * @function _postBasicAuthenticationWithSoapOnIdP
	 * @param {object} myResponse
	 * @param {string} myBody
	 * @param {string} myProductUrl
	 * @param {object} myWc
	 * @param {string} myCurrentPath
	 * @param {string} myCredentials
	 * @private
	 */
	_postBasicAuthenticationWithSoapOnIdP(myResponse, myBody, myProductUrl, myWc, myCurrentPath, myCredentials) {

		console.log('----------------------------------------------------------------------');
		console.log('_postBasicAuthenticationWithSoapOnIdP');
		console.log('----------------------------------------------------------------------');
		console.log('headers:\n' + JSON.stringify(myResponse.headers));
		log.debug('ECP _postBasicAuthenticationWithSoapOnIdP');
		log.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

		let _that = this;

		let _headerStart = myBody.indexOf(HEADER_START_STRING);
		let _headerEnd = myBody.indexOf(HEADER_END_STRING);
		// Get the header
		let _header = myBody.slice(_headerStart, _headerEnd + HEADER_END_STRING.length);
		let _rsStart = _header.indexOf(RS_START_STRING);
		let _rsEnd = _header.indexOf(RS_END_STRING);
		// Get the relay state
		let _relayState = _header.slice(_rsStart, _rsEnd + RS_END_STRING.length);
		let _samlResponseWithoutHeaderPrefix = myBody.slice(0, _headerStart);
		let _samlResponseWithoutHeaderPostfix = myBody.slice(_headerEnd + HEADER_END_STRING.length);
		// Form an xml doc without the sent header
		let _idpRequest = _samlResponseWithoutHeaderPrefix + _samlResponseWithoutHeaderPostfix;

		// base64 encode the user:pass combination for BASIC AUTH
		//var _base64UserPwd = btoa(name + ':' + password);
		let _base64UserPwd = btoa(myCredentials.username + ':' + myCredentials.password);
		log.debug('ECP _base64UserPwd: ' + _base64UserPwd);

		// options
		let _options = {
			host: IDP_HOST,
			port: HTTPS_PORT,
			path: IDP_ECP_ENDPOINT,
			method: 'POST',
			headers: {
				'Accept' : 'text/html',
				'Authorization' : 'Basic ' + _base64UserPwd,
				'Content-Type': 'text/xml'
			},
			dataType: 'text',
			data: _idpRequest,
			timeout: 20000
		};

		//request
		let _req = https.request(_options, (_resp) => {
			let _body = '';
			_resp.on('data', (_chunk) => {
				_body += _chunk;
			});
			_resp.on('end', () => {
				_that._postAuthenticationOnServiceProvider(_resp, _body, _relayState, myProductUrl, myWc, myCurrentPath);
			});
		});
		_req.write(_idpRequest);
		_req.on('error', (e) => {
			console.log('ECP _postBasicAuthenticationWithSoapOnIdP error ' + e);
			log.error('ECP _postBasicAuthenticationWithSoapOnIdP error ' + e);
			myWc.send('downloadError', {
				url: myProductUrl,
				errorMsg: e
			});
		});
		_req.end();

	}

	/**
	 * Create and send authentication response to SP
	 *
	 * @function _postAuthenticationOnServiceProvider
	 * @param {object} myResponse
	 * @param {string} myBody
	 * @param {string} myRelayState
	 * @param {string} myProductUrl
	 * @param {object} myWc
	 * @param {string} myCurrentPath
	 * @private
	 */
	_postAuthenticationOnServiceProvider(myResponse, myBody, myRelayState, myProductUrl, myWc, myCurrentPath) {

		console.log('----------------------------------------------------------------------');
		console.log('_postAuthenticationOnServiceProvider');
		console.log('----------------------------------------------------------------------');
		console.log('headers:\n' + JSON.stringify(myResponse.headers));
		log.debug('ECP _postAuthenticationOnServiceProvider');
		log.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

		let _that = this;

		let _stringRelayState = myRelayState + '';

		// Adjust the xml namespace slightly on the relay state
		let _relayStateNSAdjusted = _stringRelayState.replace(/S:/g,"soap11:");
		// Extract the first part of the response
		let _soapStart = myBody.indexOf(SOAP_ENVELOPE_START_STRING);
		let _acsStart = myBody.indexOf(ACS_START_STRING);
		let _soapEnvelopeFirstPart = myBody.slice(_soapStart, _acsStart);

		// The ACS URL should be verified with the one received from the SP

		// Extract the last part of the response
		let _reqAuthenticated = myBody.indexOf(REQ_AUTHENTICATED_START_STRING);
		let _soapEnvelopeLastPart = myBody.slice(_reqAuthenticated);

		// Form the response including the relay state header
		let _soap = _soapEnvelopeFirstPart + _relayStateNSAdjusted + _soapEnvelopeLastPart;

		// options
		let _options = {
			host: SP_HOST,
			port: HTTPS_PORT,
			path: SP_ECP_ENDPOINT,
			method: 'POST',
			followAllRedirects: true,
			headers: { 'Content-Type': 'application/vnd.paos+xml'},
			dataType: 'text'
		};
		// request
		let _req = https.request(_options, (_resp) => {
			let _body = '';
			_resp.on('data', (_chunk) => {
				_body += _chunk;
			});
			_resp.on('end', () => {
				_that._getRedirectAttrChecker(_resp, _body, myProductUrl, myWc, myCurrentPath);
			});
		});
		_req.write(_soap);
		_req.on('error', (e) => {
			console.log('ECP _postAuthenticationOnServiceProvider error ' + e);
			log.error('ECP _postAuthenticationOnServiceProvider error ' + e);
			myWc.send('downloadError', {
				url: myProductUrl,
				errorMsg: e
			});
		});
		_req.end();

	}

	/**
	 * Follow redirect to SP Attr checker
	 *
	 * @function _getRedirectAttrChecker
	 * @param {object} myResponse
	 * @param {string} myBody
	 * @param {string} myProductUrl
	 * @param {object} myWc
	 * @param {string} myCurrentPath
	 * @private
	 */
	_getRedirectAttrChecker(myResponse, myBody, myProductUrl, myWc, myCurrentPath) {

		console.log('----------------------------------------------------------------------');
		console.log('_getRedirectAttrChecker');
		console.log('----------------------------------------------------------------------');
		console.log('headers:\n' + JSON.stringify(myResponse.headers));
		log.debug('ECP _getRedirectAttrChecker');
		log.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

		let _that = this;

		// Get the shibb session cookie
		let _shibbSessionHeaderCookie = myResponse.headers['set-cookie'];
		console.log('shibbSessionHeaderCookie: \n' + _shibbSessionHeaderCookie + '\n');
		log.debug('ECP shibbSessionHeaderCookie \n' + _shibbSessionHeaderCookie + '\n');

		// Retrieve the rediction location
		let _redirectionURL = myResponse.headers['location'];
		// Remove the https host from the URL
		_redirectionURL = _redirectionURL.slice(HTTPS_STRING.length + SP_HOST.length);

		let _options = {
			host: SP_HOST,
			port: HTTPS_PORT,
			path: _redirectionURL,
			method: 'GET',
			headers: {
				'Content-Type': 'application/vnd.paos+xml',
				'Cookie' : _shibbSessionHeaderCookie
			}
		};

		let _req = https.request(_options, (_resp) => {
			let _body = '';
			_resp.on('data', (_chunk) => {
				_body += _chunk;
			});
			_resp.on('end', () => {
				_that._getRedirectECPHook(_resp, _body, _shibbSessionHeaderCookie, myProductUrl, myWc, myCurrentPath);
			});
		});
		_req.on('error', (e) => {
			console.log('ECP _getRedirectAttrChecker error ' + e);
			log.error('ECP _getRedirectAttrChecker error ' + e);
			myWc.send('downloadError', {
				url: myProductUrl,
				errorMsg: e
			});
		});
		_req.end();

	}

	/**
	 * Follow redirect to ECP hook
	 *
	 * @function _getRedirectECPHook
	 * @param {object} myResponse
	 * @param {string} myBody
	 * @param {string} myShibbSessionHeaderCookie
	 * @param {string} myProductUrl
	 * @param {object} myWc
	 * @param {string} myCurrentPath
	 */
	_getRedirectECPHook(myResponse, myBody, myShibbSessionHeaderCookie, myProductUrl, myWc, myCurrentPath) {

		console.log('----------------------------------------------------------------------');
		console.log('_getRedirectECPHook');
		console.log('----------------------------------------------------------------------');
		console.log('headers:\n' + JSON.stringify(myResponse.headers));
		log.debug('ECP _getRedirectECPHook');
		log.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

		let _that = this;

		// Retrieve the rediction location
		var _redirectionPath = myResponse.headers['location'];
		// Remove the https host from the URL
		_redirectionPath = _redirectionPath.slice(HTTPS_STRING.length + SP_HOST.length);

		// options
		let _options = {
			host: SP_HOST,
			port: HTTPS_PORT,
			path: _redirectionPath,
			method: 'GET',
			headers: {
				'Content-Type': 'application/vnd.paos+xml',
				'Cookie' : myShibbSessionHeaderCookie
			}
		};
		// request
		let _req = https.request(_options, (_resp) => {
			let _body = '';
			_resp.on('data', (_chunk) => {
				_body += _chunk;
			});
			_resp.on('end', () => {
				_that._getRedirectToRessource(_resp, _body, myShibbSessionHeaderCookie, myProductUrl, myWc, myCurrentPath);
			});
		});
		_req.on('error', (e) => {
			console.log('ECP _getRedirectECPHook error ' + e);
			log.error('ECP _getRedirectECPHook error ' + e);
			myWc.send('downloadError', {
				url: myProductUrl,
				errorMsg: e
			});
		});
		_req.end();

	}

	/**
	 *
	 * @function _getRedirectToRessource
	 * @param {object} myResponse
	 * @param {string} myBody
	 * @param {string} myShibbSessionHea*derCookie
	 * @param {string} myProductUrl
	 * @param {object} myWc
	 * @param {string} myCurrentPath
	 * @private
	 */
	_getRedirectToRessource(myResponse, myBody, myShibbSessionHeaderCookie, myProductUrl, myWc, myCurrentPath) {

		console.log('----------------------------------------------------------------------');
		console.log('_getRedirectToRessource');
		console.log('----------------------------------------------------------------------');
		console.log('headers:\n' + JSON.stringify(myResponse.headers));
		log.debug('ECP _getRedirectToRessource');
		log.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

		let _that = this;

		let _redirectionPath = myResponse.headers['location'];
		// Remove the https host from the URL
		_redirectionPath = _redirectionPath.slice(HTTPS_STRING.length + SP_HOST.length);

		console.log("redirectionPath " + _redirectionPath);
		log.debug('ECP redirectionPath ' + _redirectionPath);
		let _fileName = _redirectionPath.slice(_redirectionPath.lastIndexOf('/') + 1);
		console.log("fileName " + _fileName);
		log.debug('ECP fileName ' + _fileName);

		// options
		let _options = {
			host: SP_HOST,
			port: HTTPS_PORT,
			path: _redirectionPath,
			method: 'GET',
			headers: {
				'Content-Type': 'application/vnd.paos+xml',
				'Cookie' : myShibbSessionHeaderCookie
			}
		};

		// request
		let _req = https.request(_options, (_resp) => {
			_that._saveRessource(_resp, _fileName, myProductUrl, myWc, myCurrentPath);
		});
		_req.on('error', (e) => {
			console.log('ECP _getRedirectToRessource error ' + e);
			log.debug('ECP _getRedirectToRessource error ' + e);
			myWc.send('downloadError', {
				url: myProductUrl,
				errorMsg: e
			});
		});
		_req.end();

	}

	/**
	 * @function _saveRessource
	 * @param {object} myResponse
	 * @param {string} myFileName
	 * @param {string} myProductUrl
	 * @param {object} myWc
	 * @param {string} myCurrentPath
	 * @private
	 */
	_saveRessource(myResponse, myFileName, myProductUrl, myWc, myCurrentPath) {

		console.log('----------------------------------------------------------------------');
		console.log('_saveRessource');
		console.log('----------------------------------------------------------------------');
		console.log('headers:\n' + JSON.stringify(myResponse.headers));
		log.debug('ECP _saveRessource');
		log.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

		let _that = this;

		console.log('Download started for file ' + myFileName);
		log.debug('ECP Download started for file ' + myFileName);

		// Write the resource to a file
		if (myFileName == '') {
			myFileName = 'resource.txt';
		}
		let _wstream = fs.createWriteStream(myCurrentPath + myFileName);

		let _bytesDone = 0;
		let _bytesTotal = parseInt(myResponse.headers['content-length']);
		console.log('bytes total:' + _bytesTotal);
		log.debug('ECP bytes total:' + _bytesTotal);

		myResponse.on('data', function (_chunk) {
			_bytesDone += _chunk.byteLength;
			console.log(_bytesDone);
			log.debug('ECP ' + _bytesDone);
			_wstream.write(_chunk);
			myWc.send('downloadUpdated', {
				url: myProductUrl,
				progress: _bytesDone / _bytesTotal,
				received: _bytesDone
			});
		})
		myResponse.on('end', function () {
			_wstream.end();
			myWc.send('downloadCompleted', {
				url: myProductUrl,
				path: myCurrentPath + myFileName
			});
		})

		console.log('Download finished');
		log.debug('ECP Download finished');

	}
	/**
	 *
	 * @function downloadProduct
	 * @param {string} myProductUrl
	 * @param {object} myWc - WebContent used for displaying progress bar
	 * @param {string} myCurrentPath - path to save the file on device
	 * @param {string} myCredentials - credentials
	 * @returns
	 * @public
	 */
	downloadProduct(myProductUrl, myWc, myCurrentPath, myCredentials) {
		this._getSoapForUrl(myProductUrl, myWc, myCurrentPath, myCredentials);
	}

}

/**
 * ElectronSettings event names.
 *
 * @enum {string}
 * @readonly
 */
ECP.Events = {
  CHANGE: 'change'
};

module.exports = ECP;