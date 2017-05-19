import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions, Response, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/timeout';

import { URL } from 'url';

// MODELS
import { ProductStatus } from '../models/dar-status';

// SERVICES
import { SettingsService } from './settings.service';

const HEADER_START_STRING = '<S:Header>';
const HEADER_END_STRING = '</S:Header>';
const RS_START_STRING = '<ecp:RelayState';
const RS_END_STRING = '</ecp:RelayState>';
const SOAP_ENVELOPE_START_STRING = '<soap11:Envelope';
const ACS_START_STRING = '<ecp:Response AssertionConsumerServiceURL';
const REQ_AUTHENTICATED_START_STRING = '<ecp:RequestAuthenticated';
const HTTPS_STRING = 'https://';

@Injectable()
export class ECPService {


	constructor(private _http: Http, private _settingsService: SettingsService ) {

	}

	/**
	 * @function getProductUrl
	 * @param myProductUrl
	 */
	getProduct(myProduct: ProductStatus): Observable<Response> {
		return this.getSoapForProductUrl(myProduct.productURL);
	}

	/**
	 * @function getSoapForProductUrl
	 * @param myProductUrl
	 */
	getSoapForProductUrl(myProductUrl: string): Observable<Response> {

		// url
		let _url = myProductUrl;

		// headers + options
		let _headers = new Headers();
		_headers.append('Accept', 'text/html; application/vnd.paos+xml');
		_headers.append('PAOS', 'ver=\"urn:liberty:paos:2003-08\";\"urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp\"');
		let _options = new RequestOptions({ headers: _headers });

		return this._http
			.get(_url, _options)
			.map(
			(response: Response) => {
				return response;
			})
			.mergeMap((response: Response) => {
				return this.postBasicAuthenticationWithSoapOnIdP(response);
			});
	}

	/**
	 * @function postBasicAuthenticationWithSoapOnIdP
	 * @param myResponse
	 */
	postBasicAuthenticationWithSoapOnIdP(myResponse: Response): Observable<Response> {

		// -----------------------------------------
		// url
		// -----------------------------------------
		let _url = 'https://eodata-idp.user.eocloud.eu/idp/profile/SAML2/SOAP/ECP';

		// -----------------------------------------
		// headers
		// -----------------------------------------
		let _base64UserPwd = btoa(this._settingsService.get('username') + ':' + this._settingsService.get('password'));
		let _headers = new Headers();
		_headers.append('Accept', 'text/html');
		_headers.append('Authorization', 'Basic ' + _base64UserPwd);
		_headers.append('Content-Type', 'text/xml');
		let _options = new RequestOptions({ headers: _headers });

		// -----------------------------------------
		// body
		// -----------------------------------------
		let _bodyResponse = myResponse.text();
		var headerStart = _bodyResponse.indexOf(HEADER_START_STRING);
		var headerEnd = _bodyResponse.indexOf(HEADER_END_STRING);
		// Get the header
		var header = _bodyResponse.slice(headerStart, headerEnd + HEADER_END_STRING.length);
		var rsStart = header.indexOf(RS_START_STRING);
		var rsEnd = header.indexOf(RS_END_STRING);
		// Get the relay state
		var relayState = header.slice(rsStart, rsEnd + RS_END_STRING.length);
		var samlResponseWithoutHeaderPrefix = _bodyResponse.slice(0, headerStart);
		var samlResponseWithoutHeaderPostfix = _bodyResponse.slice(headerEnd + HEADER_END_STRING.length);
		// Form an xml doc without the sent header
		let _body = samlResponseWithoutHeaderPrefix + samlResponseWithoutHeaderPostfix;

		return this._http
			.post(_url, _body, _options)
			.timeout(20000)
			.map((response: Response) => {
				return response;
			})
			.mergeMap((myResponse) => {
				return this.postAuthenticationOnServiceProvider(myResponse, relayState);
			});

	}

	/**
	 * @function postAuthenticationOnServiceProvider
	 * @param myResponse
	 * @param myRelayState
	 */
	postAuthenticationOnServiceProvider(myResponse: Response, myRelayState: string): Observable<Response> {

		// -----------------------------------------
		// url
		// -----------------------------------------
		let _url = 'https://eodata-service.user.eocloud.eu/Shibboleth.sso/SAML2/ECP';

		// -----------------------------------------
		// headers
		// -----------------------------------------
		let _headers = new Headers();
		_headers.append('Content-Type', 'application/vnd.paos+xml');
		let _options = new RequestOptions({ headers: _headers });

		// -----------------------------------------
		// body
		// -----------------------------------------
		let _bodyResponse = myResponse.text();
		var stringRelayState = myRelayState + '';

		// Adjust the xml namespace slightly on the relay state
		var relayStateNSAdjusted = stringRelayState.replace(/S:/g, 'soap11:');
		// Extract the first part of the response
		var soapStart = _bodyResponse.indexOf(SOAP_ENVELOPE_START_STRING);
		var acsStart = _bodyResponse.indexOf(ACS_START_STRING);
		var soapEnvelopeFirstPart = _bodyResponse.slice(soapStart, acsStart);

		// The ACS URL should be verified with the one received from the SP

		// Extract the last part of the response
		var reqAuthenticated = _bodyResponse.indexOf(REQ_AUTHENTICATED_START_STRING);
		var soapEnvelopeLastPart = _bodyResponse.slice(reqAuthenticated);

		// Form the response including the relay state header
		let _body = soapEnvelopeFirstPart + relayStateNSAdjusted + soapEnvelopeLastPart;

		// -----------------------------------------
		// send http request
		// -----------------------------------------
		return this._http
			.post(_url, _body, _options);
			/*
			.timeout(20000)
			.map((response: Response) => {
				return response;
			})
			.mergeMap((myResponse) => {
				return this.getProductUrlWithSsoCookie(myResponse);
			});
			*/

	}

}
