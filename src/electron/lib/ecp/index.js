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
 * @returns
 * @private
 */
function _getSoapForUrl(myOptions) {

	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP _getSoapForUrl');
	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug(myOptions.url);

	let _url;
	try {
		_url = url.parse(myOptions.url);
	} catch (e) {
		myOptions.logger.error('ECP _getSoapForUrl error', e);
		myOptions.wc.send('downloadError', {
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
			_postBasicAuthenticationWithSoapOnIdP(_resp, _body, myOptions);
		});
	});
	_req.on('error', (e) => {
		myOptions.logger.error('ECP _getSoapForUrl error ' + e);
		myOptions.wc.send('downloadError', {
			url: myOptions.url,
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
 * @param {object} myOptions
 * @private
 */
function _postBasicAuthenticationWithSoapOnIdP(myResponse, myBody, myOptions) {

	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP _postBasicAuthenticationWithSoapOnIdP');
	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

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
	myOptions.logger.debug('ECP _idpRequest: ' + _idpRequest);

	// base64 encode the user:pass combination for BASIC AUTH
	//var _base64UserPwd = btoa(name + ':' + password);
	let _base64UserPwd = '';
	if (myOptions.credentials && myOptions.credentials.username && myOptions.credentials.password) {
		_base64UserPwd = btoa(myOptions.credentials.username + ':' + myOptions.credentials.password);
	}
	myOptions.logger.debug('ECP _base64UserPwd: ' + _base64UserPwd);

	// options
	let _options = {
		host: myOptions.configuration.ecp.identityprovider.host,
		port: HTTPS_PORT,
		path: myOptions.configuration.ecp.identityprovider.endpoint,
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
			_postAuthenticationOnServiceProvider(_resp, _body, _relayState, myOptions);
		});
	});
	_req.write(_idpRequest);
	_req.on('error', (e) => {
		myOptions.logger.error('ECP _postBasicAuthenticationWithSoapOnIdP error ' + e);
		myOptions.wc.send('downloadError', {
			url: myOptions.url,
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
 * @param {object} myOptions
 * @private
 */
function _postAuthenticationOnServiceProvider(myResponse, myBody, myRelayState, myOptions) {

	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP _postAuthenticationOnServiceProvider');
	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

	let _stringRelayState = myRelayState + '';

	// Adjust the xml namespace slightly on the relay state
	let _relayStateNSAdjusted = _stringRelayState.replace(/S:/g, "soap11:");
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
		host: myOptions.configuration.ecp.serviceprovider.host,
		port: HTTPS_PORT,
		path: myOptions.configuration.ecp.serviceprovider.endpoint,
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
			_getRedirectAttrChecker(_resp, _body, myOptions);
		});
	});
	_req.write(_soap);
	_req.on('error', (e) => {
		myOptions.logger.error('ECP _postAuthenticationOnServiceProvider error ' + e);
		myOptions.wc.send('downloadError', {
			url: myOptions.url,
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
 * @param {object} myOptions
 * @private
 */
function _getRedirectAttrChecker(myResponse, myBody, myOptions) {

	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP _getRedirectAttrChecker');
	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

	// Get the shibb session cookie
	let _shibbSessionHeaderCookie = myResponse.headers['set-cookie'];
	myOptions.logger.debug('ECP shibbSessionHeaderCookie \n' + _shibbSessionHeaderCookie + '\n');

	if (typeof _shibbSessionHeaderCookie === 'undefined') {
		myOptions.wc.send('downloadError', {
			url: myOptions.url,
			errorMsg: 'Not authorized (bad credentials)'
		});
		return;
	}

	// Retrieve the rediction location
	let _redirectionURL = myResponse.headers['location'];
	// Remove the https host from the URL
	_redirectionURL = _redirectionURL.slice(HTTPS_STRING.length + myOptions.configuration.ecp.serviceprovider.host.length);

	let _options = {
		host: myOptions.configuration.ecp.serviceprovider.host,
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
			_getRedirectECPHook(_resp, _body, _shibbSessionHeaderCookie, myOptions);
		});
	});
	_req.on('error', (e) => {
		myOptions.logger.error('ECP _getRedirectAttrChecker error ' + e);
		myOptions.wc.send('downloadError', {
			url: myOptions.url,
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
 * @param {object} myOptions
 */
function _getRedirectECPHook(myResponse, myBody, myShibbSessionHeaderCookie, myOptions) {

	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP _getRedirectECPHook');
	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

	// Retrieve the rediction location
	var _redirectionPath = myResponse.headers['location'];
	// Remove the https host from the URL
	_redirectionPath = _redirectionPath.slice(HTTPS_STRING.length + myOptions.configuration.ecp.serviceprovider.host.length);

	// options
	let _options = {
		host: myOptions.configuration.ecp.serviceprovider.host,
		port: HTTPS_PORT,
		path: _redirectionPath,
		method: 'GET',
		headers: {
			'Content-Type': 'application/vnd.paos+xml',
			'Cookie': myShibbSessionHeaderCookie
		}
	};
	// request
	let _req = https.request(_options, (_resp) => {
		let _body = '';
		_resp.on('data', (_chunk) => {
			_body += _chunk;
		});
		_resp.on('end', () => {
			_getRedirectToRessource(_resp, _body, myShibbSessionHeaderCookie, myOptions);
		});
	});
	_req.on('error', (e) => {
		myOptions.logger.error('ECP _getRedirectECPHook error ' + e);
		myOptions.wc.send('downloadError', {
			url: myOptions.url,
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
 * @param {string} myShibbSessionHeaderCookie
 * @param {object} myOptions
 * @private
 */
function _getRedirectToRessource(myResponse, myBody, myShibbSessionHeaderCookie, myOptions) {

	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP _getRedirectToRessource');
	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

	let _redirectionPath = myResponse.headers['location'];
	// Remove the https host from the URL
	_redirectionPath = _redirectionPath.slice(HTTPS_STRING.length + myOptions.configuration.ecp.serviceprovider.host.length);

	myOptions.logger.debug('ECP redirectionPath ' + _redirectionPath);
	let _fileName = _redirectionPath.slice(_redirectionPath.lastIndexOf('/') + 1);
	myOptions.logger.debug('ECP fileName ' + _fileName);

	// options
	let _options = {
		host: myOptions.configuration.ecp.serviceprovider.host,
		port: HTTPS_PORT,
		path: _redirectionPath,
		method: 'GET',
		headers: {
			'Content-Type': 'application/vnd.paos+xml',
			'Cookie': myShibbSessionHeaderCookie
		}
	};

	// request
	let _req = https.request(_options, (_resp) => {
		_saveRessource(_resp, _fileName, myOptions);
	});
	_req.on('error', (e) => {
		myOptions.logger.error('ECP _getRedirectToRessource error ' + e);
		myOptions.wc.send('downloadError', {
			url: myOptions.url,
			errorMsg: e
		});
	});
	_req.end();

}

/**
 * @function _saveRessource
 * @param {object} myResponse
 * @param {string} myFileName
 * @param {object} myOptions
 * @private
 */
function _saveRessource(myResponse, myFileName, myOptions) {

	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP _saveRessource');
	myOptions.logger.debug('----------------------------------------------------------------------');
	myOptions.logger.debug('ECP headers:\n' + JSON.stringify(myResponse.headers));

	myOptions.logger.debug('ECP Download started for file ' + myFileName);

	// Write the resource to a file
	if (myFileName == '') {
		myFileName = 'resource.txt';
	}
	let _wstream = fs.createWriteStream(myOptions.path + myFileName);

	let _bytesDone = 0;
	let _bytesTotal = parseInt(myResponse.headers['content-length']);
	myOptions.logger.debug('ECP bytes total:' + _bytesTotal);

	myResponse.on('data', function (_chunk) {
		_bytesDone += _chunk.byteLength;
		myOptions.logger.debug('ECP ' + _bytesDone + ' bytes done');
		_wstream.write(_chunk);
		myOptions.wc.send('downloadUpdated', {
			url: myOptions.url,
			progress: _bytesDone / _bytesTotal,
			received: _bytesDone
		});
	})
	myResponse.on('end', function () {
		myOptions.logger.debug('ECP end');
		_wstream.end();
		myOptions.wc.send('downloadCompleted', {
			url: myOptions.url,
			path: myOptions.path + myFileName
		});
	})

}

/**
 *
 * @function downloadURL
 * @param {object} myOptions (URL, WebContent, CurrentPath, Credentials, Configuration, Logger)
 * @returns
 * @public
 */
function downloadURL(myOptions) {
	if (!myOptions.logger) {
		myOptions.logger = console;
	}
	if (myOptions.url && myOptions.url !== '') {
		_getSoapForUrl(myOptions);
	}
}

let ECP = {
	downloadURL: downloadURL
}

module.exports = ECP;