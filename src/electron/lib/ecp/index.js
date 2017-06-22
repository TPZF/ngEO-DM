const https = require('https');
const url = require('url');
const fs = require('fs');
const btoa = require('btoa');

const HTTPS_PORT = 443;

const HEADER_START_STRING = '<S:Header>';
const HEADER_END_STRING = '</S:Header>';
const RS_START_STRING = '<ecp:RelayState';
const RS_END_STRING = '</ecp:RelayState>';
const SOAP_ENVELOPE_START_STRING = "<soap11:Envelope";
const ACS_START_STRING = '<ecp:Response AssertionConsumerServiceURL';
const REQ_AUTHENTICATED_START_STRING = '<ecp:RequestAuthenticated';
const HTTPS_STRING = 'https://';

/**
 * Call myOptions.url with specific header,
 * in order to get soap envelop for next request
 *
 * @function _getSoapForUrl
 * @param {object} myOptions
 * @returns {Promise}
 * @private
 */
function _getSoapForUrl(myOptions) {

	return new Promise((resolve, reject) => {

		myOptions.logger.debug('----------------------------------------------------------------------');
		myOptions.logger.debug('ECP _getSoapForUrl');
		myOptions.logger.debug('----------------------------------------------------------------------');
		myOptions.logger.debug(myOptions.url);

		let _url;
		try {
			_url = url.parse(myOptions.url);
		} catch (e) {
			myOptions.logger.error('ECP _getSoapForUrl error', e);
			reject({
				url: myOptions.url,
				errorMsg: e
			});
		}

		// options
		let _options = {
			host: _url.host,
			port: _url.port,
			path: _url.path,
			method: 'GET',
			headers: {
				Accept: 'text/html; application/vnd.paos+xml',
				PAOS: 'ver=\"urn:liberty:paos:2003-08\";\"urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp\"'
			}
		}

		// request
		let _req = https.request(_options, (_resp) => {
			let _body = '';
			_resp.on('data', (_chunk) => {
				_body += _chunk;
			});
			_resp.on('end', () => {
				resolve({
					response: _resp,
					body: _body,
					options: myOptions
				});
			});
		});
		_req.on('error', (e) => {
			myOptions.logger.error('ECP _getSoapForUrl error ' + e);
			reject({
				url: myOptions.url,
				errorMsg: e
			});
		});
		_req.end();

	})

}

/**
 * Create and send the authentication request to the IdP
 *
 * @function _postBasicAuthenticationWithSoapOnIdP
 * @param {object} myPromiseResponse - contains response, body and options
 * @returns {Promise}
 * @private
 */
function _postBasicAuthenticationWithSoapOnIdP(myPromiseResponse) {

	return new Promise((resolve, reject) => {
		myPromiseResponse.options.logger.debug('----------------------------------------------------------------------');
		myPromiseResponse.options.logger.debug('ECP _postBasicAuthenticationWithSoapOnIdP');
		myPromiseResponse.options.logger.debug('----------------------------------------------------------------------');
		myPromiseResponse.options.logger.debug('ECP headers:\n' + JSON.stringify(myPromiseResponse.response.headers));

		let _headerStart = myPromiseResponse.body.indexOf(HEADER_START_STRING);
		let _headerEnd = myPromiseResponse.body.indexOf(HEADER_END_STRING);
		// Get the header
		let _header = myPromiseResponse.body.slice(_headerStart, _headerEnd + HEADER_END_STRING.length);
		let _rsStart = _header.indexOf(RS_START_STRING);
		let _rsEnd = _header.indexOf(RS_END_STRING);
		// Get the relay state
		let _relayState = _header.slice(_rsStart, _rsEnd + RS_END_STRING.length);
		myPromiseResponse.options.logger.debug('ECP _relayState: ' + _relayState);
		let _samlResponseWithoutHeaderPrefix = myPromiseResponse.body.slice(0, _headerStart);
		let _samlResponseWithoutHeaderPostfix = myPromiseResponse.body.slice(_headerEnd + HEADER_END_STRING.length);
		// Form an xml doc without the sent header
		let _idpRequest = _samlResponseWithoutHeaderPrefix + _samlResponseWithoutHeaderPostfix;
		myPromiseResponse.options.logger.debug('ECP _idpRequest: ' + _idpRequest);

		// base64 encode the user:pass combination for BASIC AUTH
		//var _base64UserPwd = btoa(name + ':' + password);
		let _base64UserPwd = '';
		if (myPromiseResponse.options.credentials && myPromiseResponse.options.credentials.username && myPromiseResponse.options.credentials.password) {
			_base64UserPwd = btoa(myPromiseResponse.options.credentials.username + ':' + myPromiseResponse.options.credentials.password);
		}
		myPromiseResponse.options.logger.debug('ECP _base64UserPwd: ' + _base64UserPwd);

		// options
		let _options = {
			host: myPromiseResponse.options.configuration.ecp.identityprovider.host,
			port: HTTPS_PORT,
			path: myPromiseResponse.options.configuration.ecp.identityprovider.endpoint,
			method: 'POST',
			headers: {
				'Accept': 'text/html',
				'Authorization': 'Basic ' + _base64UserPwd,
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
				resolve({
					response: _resp,
					body: _body,
					relayState: _relayState,
					options: myPromiseResponse.options
				});
			});
		});
		_req.write(_idpRequest);
		_req.on('error', (e) => {
			myPromiseResponse.options.logger.error('ECP _postBasicAuthenticationWithSoapOnIdP error ' + e);
			reject({
				url: myPromiseResponse.options.url,
				errorMsg: e
			});
		});
		_req.end();
	});
}

/**
 * Create and send authentication response to SP
 *
 * @function _postAuthenticationOnServiceProvider
 * @param {object} myPromiseResponse - contains response, body, relayState and options
 * @returns {Promise}
 * @private
 */
function _postAuthenticationOnServiceProvider(myPromiseResponse) {

	return new Promise((resolve, reject) => {
		myPromiseResponse.options.logger.debug('----------------------------------------------------------------------');
		myPromiseResponse.options.logger.debug('ECP _postAuthenticationOnServiceProvider');
		myPromiseResponse.options.logger.debug('----------------------------------------------------------------------');
		myPromiseResponse.options.logger.debug('ECP headers:\n' + JSON.stringify(myPromiseResponse.response.headers));

		let _stringRelayState = myPromiseResponse.relayState + '';

		// Adjust the xml namespace slightly on the relay state
		let _relayStateNSAdjusted = _stringRelayState.replace(/S:/g, "soap11:");
		// Extract the first part of the response
		let _soapStart = myPromiseResponse.body.indexOf(SOAP_ENVELOPE_START_STRING);
		let _acsStart = myPromiseResponse.body.indexOf(ACS_START_STRING);
		let _soapEnvelopeFirstPart = myPromiseResponse.body.slice(_soapStart, _acsStart);

		// The ACS URL should be verified with the one received from the SP

		// Extract the last part of the response
		let _reqAuthenticated = myPromiseResponse.body.indexOf(REQ_AUTHENTICATED_START_STRING);
		let _soapEnvelopeLastPart = myPromiseResponse.body.slice(_reqAuthenticated);

		// Form the response including the relay state header
		let _soap = _soapEnvelopeFirstPart + _relayStateNSAdjusted + _soapEnvelopeLastPart;

		// options
		let _options = {
			host: myPromiseResponse.options.configuration.ecp.serviceprovider.host,
			port: HTTPS_PORT,
			path: myPromiseResponse.options.configuration.ecp.serviceprovider.endpoint,
			method: 'POST',
			followAllRedirects: true,
			headers: { 'Content-Type': 'application/vnd.paos+xml' },
			dataType: 'text'
		};
		// request
		let _req = https.request(_options, (_resp) => {
			let _body = '';
			_resp.on('data', (_chunk) => {
				_body += _chunk;
			});
			_resp.on('end', () => {
				resolve({
					response: _resp,
					body: _body,
					options: myPromiseResponse.options
				});
			});
		});
		_req.write(_soap);
		_req.on('error', (e) => {
			myPromiseResponse.options.logger.error('ECP _postAuthenticationOnServiceProvider error ' + e);
			reject({
				url: myPromiseResponse.options.url,
				errorMsg: e
			});
		});
		_req.end();
	});
}

/**
 * Follow redirect to SP Attr checker
 *
 * @function _getRedirectAttrChecker
 * @param {object} myPromiseResponse
 * @returns {Promise}
 * @private
 */
function _getRedirectAttrChecker(myPromiseResponse) {

	return new Promise((resolve, reject) => {
		myPromiseResponse.options.logger.debug('----------------------------------------------------------------------');
		myPromiseResponse.options.logger.debug('ECP _getRedirectAttrChecker');
		myPromiseResponse.options.logger.debug('----------------------------------------------------------------------');
		myPromiseResponse.options.logger.debug('ECP headers:\n' + JSON.stringify(myPromiseResponse.response.headers));

		// Get the shibb session cookie
		let _shibbSessionHeaderCookie = myPromiseResponse.response.headers['set-cookie'];
		myPromiseResponse.options.logger.debug('ECP shibbSessionHeaderCookie \n' + _shibbSessionHeaderCookie + '\n');

		if (typeof _shibbSessionHeaderCookie === 'undefined') {
			reject({
				url: myPromiseResponse.options.url,
				errorMsg: 'Not authorized (bad credentials)'
			});
		}

		// Retrieve the rediction location
		let _redirectionURL = myPromiseResponse.response.headers['location'];
		// Remove the https host from the URL
		_redirectionURL = _redirectionURL.slice(HTTPS_STRING.length + myPromiseResponse.options.configuration.ecp.serviceprovider.host.length);

		let _options = {
			host: myPromiseResponse.options.configuration.ecp.serviceprovider.host,
			port: HTTPS_PORT,
			path: _redirectionURL,
			method: 'GET',
			headers: {
				'Content-Type': 'application/vnd.paos+xml',
				'Cookie': _shibbSessionHeaderCookie
			}
		};

		let _req = https.request(_options, (_resp) => {
			let _body = '';
			_resp.on('data', (_chunk) => {
				_body += _chunk;
			});
			_resp.on('end', () => {
				resolve({
					response: _resp,
					body: _body,
					shibbSessionHeaderCookie: _shibbSessionHeaderCookie,
					options: myPromiseResponse.options
				});
			});
		});
		_req.on('error', (e) => {
			myPromiseResponse.options.logger.error('ECP _getRedirectAttrChecker error ' + e);
			reject({
				url: myPromiseResponse.options.url,
				errorMsg: e
			});
		});
		_req.end();
	});

}

/**
 * Follow redirect to ECP hook
 *
 * @function _getRedirectECPHook
 * @param {object} myPromiseResponse - contains response, body, cookie shibb and options
 * @returns {Promise}
 */
function _getRedirectECPHook(myPromiseResponse) {

	return new Promise((resolve, reject) => {
		myPromiseResponse.options.logger.debug('----------------------------------------------------------------------');
		myPromiseResponse.options.logger.debug('ECP _getRedirectECPHook');
		myPromiseResponse.options.logger.debug('----------------------------------------------------------------------');
		myPromiseResponse.options.logger.debug('ECP headers:\n' + JSON.stringify(myPromiseResponse.response.headers));

		// Retrieve the rediction location
		var _redirectionPath = myPromiseResponse.response.headers['location'];
		// Remove the https host from the URL
		_redirectionPath = _redirectionPath.slice(HTTPS_STRING.length + myPromiseResponse.options.configuration.ecp.serviceprovider.host.length);

		// options
		let _options = {
			host: myPromiseResponse.options.configuration.ecp.serviceprovider.host,
			port: HTTPS_PORT,
			path: _redirectionPath,
			method: 'GET',
			headers: {
				'Content-Type': 'application/vnd.paos+xml',
				'Cookie': myPromiseResponse.shibbSessionHeaderCookie
			}
		};
		// request
		let _req = https.request(_options, (_resp) => {
			let _body = '';
			_resp.on('data', (_chunk) => {
				_body += _chunk;
			});
			_resp.on('end', () => {
				resolve({
					response: _resp,
					body: _body,
					shibbSessionHeaderCookie: myPromiseResponse.shibbSessionHeaderCookie,
					options: myPromiseResponse.options
				});
			});
		});
		_req.on('error', (e) => {
			myPromiseResponse.options.logger.error('ECP _getRedirectECPHook error ' + e);
			reject({
				url: myPromiseResponse.options.url,
				errorMsg: e
			});
		});
		_req.end();
	});
}

/**
 *
 * @function _getRedirectToRessource
 * @param {object} myPromiseResponse - contains response, body, cookie shibb and options
 * @returns {Promise}
 * @private
 */
function _getRedirectToRessource(myPromiseResponse) {

	return new Promise((resolve, reject) => {
		myPromiseResponse.options.logger.debug('----------------------------------------------------------------------');
		myPromiseResponse.options.logger.debug('ECP _getRedirectToRessource');
		myPromiseResponse.options.logger.debug('----------------------------------------------------------------------');
		myPromiseResponse.options.logger.debug('ECP headers:\n' + JSON.stringify(myPromiseResponse.response.headers));

		let _redirectionPath = myPromiseResponse.response.headers['location'];
		// Remove the https host from the URL
		_redirectionPath = _redirectionPath.slice(HTTPS_STRING.length + myPromiseResponse.options.configuration.ecp.serviceprovider.host.length);

		myPromiseResponse.options.logger.debug('ECP redirectionPath ' + _redirectionPath);
		let _fileName = _redirectionPath.slice(_redirectionPath.lastIndexOf('/') + 1);
		myPromiseResponse.options.logger.debug('ECP fileName ' + _fileName);


		// options
		let _options = {
			host: myPromiseResponse.options.configuration.ecp.serviceprovider.host,
			port: HTTPS_PORT,
			path: _redirectionPath,
			method: 'GET',
			headers: {
				'Content-Type': 'application/vnd.paos+xml',
				'Cookie': myPromiseResponse.shibbSessionHeaderCookie
			}
		};

		resolve({
			url: myPromiseResponse.options.url,
			request: _options
		});
	});
}

/**
 *
 * @function downloadURL
 * @param {object} myOptions (URL, CurrentPath, Credentials, Configuration, Logger)
 * @returns
 * @public
 */
function downloadURL(myOptions) {
	if (!myOptions.logger) {
		myOptions.logger = console;
	}
	if (myOptions.url && myOptions.url !== '') {
		return _getSoapForUrl(myOptions)
			.then((_resp) => {
				return _postBasicAuthenticationWithSoapOnIdP(_resp);
			})
			.then((_resp2) => {
				return _postAuthenticationOnServiceProvider(_resp2);
			})
			.then((_resp3) => {
				return _getRedirectAttrChecker(_resp3);
			})
			.then((_resp4) => {
				return _getRedirectECPHook(_resp4);
			})
			.then((_resp5) => {
				return _getRedirectToRessource(_resp5);
			})
			;
	}
}

let ECP = {
	downloadURL: downloadURL
}

module.exports = ECP;