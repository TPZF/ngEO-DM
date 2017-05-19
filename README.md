# ngEO Download Manager

Application used with ngEO-LWS designed to manage download subscriptions.

## Install - 3 steps

* `npm install` - install modules for project : electron, electron-packager, webpack, angular, etc
* `cd src/electron` - move to electron app
* `npm install` - install modules for electron (electron-log, electron-simple-updater)

## Dev

Two step command:

* `npm run watch` : Watch the code changes
* `npm run electron`: Start application

On each code modification, just refresh the application as it was a browser tab.

## Packaging

### Linux

* `sudo npm -g install electron-packager`: Install electron-packager globally
* `npm run packager-linux`: Package for Linux OS
* `npm run packager-windows`: Package for Windows OS
* `npm run packager-macos`: Package for Mac OS

## License

[LGPLv3]
