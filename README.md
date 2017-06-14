# ngEO Download Manager

Application used with ngEO-LWS designed to manage download subscriptions.

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

## Packaging


### For Linux

**Build app** `npm run build`

**Package** `npm run packager-linux`

### For Windows

**Build app** `npm run build`

**Package** `npm run build-windows-dist`
It generates the exe in dist folder

### For MacOS

**Build app** `npm run build`

**Package** `npm run build-mac-dist`
It generates a ngeo-downloadmanager-darwin-x64 folder with app you will find in dist folder. It will be signed with your chan key. For that you have to change the identity founded in build-->mac-->identity in package.kson which shall be your CSC_NAME
The command to check your keychain 
You remark here that the csc name is ours and will not work on your side
to see the keychain in your machine please do
`certtool y | grep Eric`
This will show all the keychain you have (ours is Eric or something like that)

**Get a certificate for codesigning** : Go to apple web site - Create a certificate with Developer ID option - Use CSR of your device

**Sign app** `codesign --deep --force --verbose --sign "<identity>" ngeo-downloadmanager.app` : Where "identity" is the common name for certificate

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
## Log files

- on Linux: `~/.config/<app name>/log.log`
- on OS X: `~/Library/Logs/<app name>/log.log`
- on Windows: `%USERPROFILE%\AppData\Roaming\<app name>\log.log`

## License

[LGPLv3]
