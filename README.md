# ngEO Download Manager

Application used with ngEO-LWS designed to manage download subscriptions.

## Supported Platforms

* OS X Yosemite and higher
* Windows 7 (with .NET Framework 4.5.2), 8.0, 8.1 and 10 (32-bit and 64-bit)
* Linux (Debian): Ubuntu Desktop 14.04, Debian 7
* Linux (Red Hat): Red Hat Enterprise Linux 7, CentOS 7, Fedora 23

## Install - 3 steps

* `npm install` - install modules for project : electron, electron-packager, webpack, angular, etc
* `cd src/electron` - move to electron app
* `npm install` - install modules for electron (electron-log, electron-simple-updater)

## Dev

Two step command:

* `npm run watch` : Watch the code changes
* `npm run electron`: Start application in Mac or Linux
* `npm run electron-windows`: Start application in Windows

On each code modification, just refresh the application as it was a browser tab.

## Pre-Packaging

:exclamation: Before you generate the installer, please change the version under
- `src/electron/package.json` the version number
- in `./package.json`, change the `url` value by the host where is deploied the Query ser ver https://github.com/TPZF/ngEO-LWS/

For exmaple if it is deploied under http://myserver:myport
then the url will be `http://myhost:myport/ngeo/downloadManagers/releases/${os}/latest`

As we have populated REST service there to process the auto update
You can check the implementation here `https://github.com/TPZF/ngEO-LWS/blob/master/src/routes/downloadManagers/index.js`

the tag to change in the `./package.json`

```javascript
"publish": [
			{
				"url": "http://localhost:3000/ngeo/downloadManagers/releases/${os}/latest",
				"provider": "generic",
				"channel": "latest"
			}
		], 
```

## Packaging


### For Linux

**Build app** `npm run build`

**Package** `npm run build-linux-dist`
It generates the AppImage in dist folder

### For Windows

**Build app** `npm run build`

**Package** `npm run build-windows-dist`

It generates in dist folder

- `ngeo-downloadmanager-<version>.exe`
- `latest.yml`

### For MacOS

**Build app** `npm run build`

**Package** `npm run build-mac-dist`
It generates a ngeo-downloadmanager-darwin-x64 folder with app you will find in dist folder. It will be signed with your chan key. For that you have to change the identity founded in build-->mac-->identity in package.json which shall be your CSC_NAME
The command to check your keychain 
You remark here that the csc name is ours and will not work on your side
to see the keychain in your machine please do
`certtool y | grep Eric`
This will show all the keychain you have (ours is Eric or something like that)

It generates in dist folder

- `ngeo-downloadmanager-<version>.dmg`
- `ngeo-downloadmanager-<version>.zip`
- `latest-mac.yml`

**Get a certificate for codesigning** : Go to apple web site - Create a certificate with Developer ID option - Use CSR of your device

**Verify signature**

```
codesign --verify -vvvv ngeo-downloadmanager.app

ngeo-downloadmanager.app: valid on disk
ngeo-downloadmanager.app: satisfies its Designated Requirement


spctl -a -vvvv ngeo-downloadmanager.app

ngeo-downloadmanager.app: accepted
source=Developer ID
origin=Developer ID Application: ...
```

## Deploying for auto update

### For Windows

Once you have generated the application put on ngeo https://github.com/TPZF/ngEO-LWS/
under `src\routes\downloadManagers\releases\download\win`
a folder with version number like 0.3.0
it will look like 
`src\routes\downloadManagers\releases\download\win\0.3.0`

put files you have generated there so it contains

- `ngeo-downloadmanager-<version>.exe`
- `latest.yml`

in our example it will be  `ngeo-downloadmanager-0.3.0.exe`

And it is done

If you have version before 0.3.0 in our example, then when you launch it (by supposing that the url for the auto update is the rigth one), it will automatically download and install the 0.3.0 version

### For Mac

Once you have generated the application put on ngeo https://github.com/TPZF/ngEO-LWS/

under `src\routes\downloadManagers\releases\download\mac`
a folder with version number like 0.3.0
it will look like 

`src\routes\downloadManagers\releases\download\mac\0.3.0`

put files you have generated there so it contains

- `ngeo-downloadmanager-<version>.zip`
- `latest-mac.yml`

in our example it will be  `ngeo-downloadmanager-0.3.0.zip`

And it is done

If you have version before 0.3.0 in our example, then when you launch it (by supposing that the url for the auto update is the rigth one), it will automatically download and install the 0.3.0 version

### For Linux

:exclamation:  No Auto update is supported

But you can put the app image 

under `src\routes\downloadManagers\releases\download\linux`

a folder with version number like 0.3.0

it will look like 
`src\routes\downloadManagers\releases\download\linux\0.3.0`

put files you have generated there so it contains

- `ngeo-downloadmanager-<version>.appimage`

in our example it will be  `ngeo-downloadmanager-0.3.0.appimage`

then to download it, just provide the url to end user to manually upgrade the version used


## Log files

- on Linux: `~/.config/<app name>/log.log`
- on OS X: `~/Library/Logs/<app name>/log.log`
- on Windows: `%USERPROFILE%\AppData\Roaming\<app name>\log.log`

## License

[LGPLv3]
