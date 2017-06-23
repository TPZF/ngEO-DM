const { app, globalShortcut } = require('electron');

const AppTray = require('./js/views/app-tray');
const MainWindow = require('./js/views/main-window');
const TopWindow = require('./js/views/top-window');
const AutoUpdaterHandler = require('./js/handlers/auto-updater');

// app version
const appVersion = require('./package.json').version;
const isDev = process.env.TODO_DEV ? process.env.TODO_DEV.trim() == "true" : false;
const configuration = require('./js/handlers/configuration');

// log
const log = require('electron-log');
log.transports.file.level = configuration.getConf(isDev).log.level;
log.transports.file.format = configuration.getConf(isDev).log.format;
log.transports.file.maxSize = configuration.getConf(isDev).log.maxSize;
/*by default it puts:
on Linux: ~/.config/<app name>/log.log
on OS X: ~/Library/Logs/<app name>/log.log
on Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log*/
//log.transports.file.file = 'ngeo-dm-log.log';

log.debug('isDev=' + isDev);
log.debug('appVersion=' + appVersion);

class DownloadManager {

	constructor() {
		this.topWindow = null;
		this.mainWindow = null;
		this.appTray = null;
		this.firstLoading = true;
	}

	init() {
		if (this.checkInstance()) {
			this.initAppListeners();
		} else {
			app.quit();
		}
	}

	checkInstance() {
		return !app.makeSingleInstance((commandLine, workingDirectory) => {
			if (this.topWindow && this.mainWindow) {
				this.mainWindow.getBrowserWindow().show();
			}
		});
	}

	initAppListeners() {

		app.on('ready', () => {

			log.debug('app.ready !');

			// create top window
			this.topWindow = new TopWindow(log);

			// create main window (web app)
			// param topWindow = parent window
			// param log : logger
			// param isDev : to display or not dev tools
			this.mainWindow = new MainWindow(this.topWindow, log, isDev);

			// create tray
			// param topWindow : for showAbout
			// param mainWindow : to open main window
			// param appVersion : for showAbout also
			// param log : logger
			this.appTray = new AppTray(this.topWindow, this.mainWindow, appVersion, log);

			// Ctrl + Q >> close and quit !
			globalShortcut.register('CommandOrControl+Q', () => {
				this.topWindow.getBrowserWindow().close();
			})

			// auto updater
			const urlLatestDownloadManager = `${configuration.getConf(isDev).qsHost}/downloadManagers/releases/latest`;
			if (!AutoUpdaterHandler.CHECKED) {
				log.debug('urlLatestDownloadManager=' + urlLatestDownloadManager);
				this.mainWindow._autoUpdater = new AutoUpdaterHandler(this.mainWindow, log);
				this.mainWindow._autoUpdater.init(urlLatestDownloadManager);
			}

		});

		app.on('activate', () => {

			log.debug('app.activate !');

			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (this.topWindow.getBrowserWindow() === null) {
				this.topWindow = new TopWindow(log);
				this.mainWindow = new MainWindow(this.topWindow, log, isDev);
			}
		});

		app.on('window-all-closed', () => {

			log.debug('app.window-all-closed !');

			// On macOS it is common for applications and their menu bar
			// to stay active until the user quits explicitly with Cmd + Q
			if (process.platform !== 'darwin') {
				app.quit();
			}
		});
	}

}

new DownloadManager().init();
