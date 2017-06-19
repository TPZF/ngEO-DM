# ECP/index.js

Request url with ECP

## Why

Because make a request with ECP lunches minimum 4 requests

1. Get url with specific headers to get soap envelop (`_getSoapForUrl`)
1. Post on Identity provider with credentials and soap envelop response of last request (`_postBasicAuthenticationWithSoapOnIdP`)
1. Post on service provider with soap response of last request (`_postAuthenticationOnServiceProvider`)
1. Get session cookie and redirect with session cookie to Attr checker (`_getRedirectAttrChecker`)
1. Get redirect with session cookie to ECP hook (`_getRedirectECPHook`)
1. Get redirect with session cookie to ressource (`_getRedirectToRessource`)
1. Get response and save it on hard disk (`_saveRessource`)

## Dependencies

- `https` node module
- `fs` node module
- `btoa` node module
- `url` node module

All requests are made under HTTPS protocol (port 443)

## API

### downloadURL(options)

Download a URL with options

`options` (`object`) must contain :

- `url` (`string`) - url to download,
- `wc` (`object`) - web content where displays infos
- `path` (`string`) - path where to save the downloaded file
- `credentials` (`object`) - credentials
- `configuration` (`object`) - configuration of ECP service provider and identity provider
- `logger` (`object` | default console) - logger

Exemple

```js
var ecp = require('ecp')
var options = {
    url: 'https//mon.site.fr/filetodowwlad.ext',
    wc: myWebContentWhereDisplaysInfos
    path: 'C:/tmp/',
    credentials: {
        username: 'moa',
        password: '*********'
    },
    configuration: {
        ecp: {
            identityprovider: {
                host: 'www.identity-provider.com',
                endpoint: '/path/to/endpoint'
            },
            serviceprovider: {
                host: 'www.service-provider.com',
                endpoint: '/path/to/endpoint'
            }
        }
    },
    logger: {
        console
    }
};
ecp.downloadURL(options)
```
