# ngEO Download Manager

Application used with ngEO-LWS designed to manage download subscriptions.

## Dev
Two step command:
* `npm run watch` : Watch the code changes
* `npm run electron`: Start application

On each code modification, just refresh the application as it was a browser tab.

## Packaging

### Linux
* `sudo npm -g install electron-packager`: Install electron-packager globally
* `electron-packager ./src/app/ ngEO-DM --overwrite`: Package (currently only for host OS only)

## License

[LGPLv3]
