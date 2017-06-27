const { app, globalShortcut } = require('electron');

const AppTray = require('./js/views/app-tray');
const MainWindow = require('./js/views/main-window');
const TopWindow = require('./js/views/top-window');
const AutoUpdaterHandler = require('./js/handlers/auto-updater');
const DownloadHandler = require('./js/handlers/download');

// app version
const appVersion = require('./package.json').version;
const configuration = require('./js/handlers/configuration');
const logger = require('./js/utils/logger');

logger.debug('isDev=' + configuration.isDevMode);
logger.debug('appVersion=' + appVersion);

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

			logger.debug('app.ready !');

			// create top window
			this.topWindow = new TopWindow();

			// create main window (web app)
			// param topWindow = parent window
			this.mainWindow = new MainWindow(this.topWindow);

			// create tray
			// param topWindow : for showAbout
			// param mainWindow : to open main window
			// param appVersion : for showAbout also
			this.appTray = new AppTray(this.topWindow, this.mainWindow, appVersion);

			// Ctrl + Q >> close and quit !
			globalShortcut.register('CommandOrControl+Q', () => {
				this.topWindow.getBrowserWindow().close();
			})

			// auto updater - map to mainWindow to modal dialog box if new update
			const urlLatestDownloadManager = `${configuration.getConf().qsHost}/downloadManagers/releases/latest`;
			if (!AutoUpdaterHandler.CHECKED) {
				logger.debug('urlLatestDownloadManager=' + urlLatestDownloadManager);
				this.mainWindow.autoUpdater = new AutoUpdaterHandler(this.mainWindow);
				this.mainWindow.autoUpdater.init(urlLatestDownloadManager);
			}

			// download - map to topWindow
			this.topWindow.downloadHandler = new DownloadHandler(this.topWindow, this.mainWindow);

		});

		app.on('activate', () => {

			logger.debug('app.activate !');

			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (this.topWindow.getBrowserWindow() === null) {
				this.topWindow = new TopWindow();
				this.mainWindow = new MainWindow(this.topWindow);
			}
		});

		app.on('window-all-closed', () => {

			logger.debug('app.window-all-closed !');

			// On macOS it is common for applications and their menu bar
			// to stay active until the user quits explicitly with Cmd + Q
			if (process.platform !== 'darwin') {
				app.quit();
			}
		});
	}

}

new DownloadManager().init();
