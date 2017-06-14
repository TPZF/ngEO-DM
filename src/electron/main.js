const { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, shell, Tray } = require('electron');

const os = require('os')
const autoUpdater = require('electron-simple-updater');
//const updater = require('auto-updater');
//const updater = require('electron').remote.autoUpdater;

// app version
const appVersion = require('./package.json').version;
const isDev = process.env.TODO_DEV ? process.env.TODO_DEV.trim() == "true" : false;

let settings = require('electron-settings');

let ecp = require('./lib/ecp');

// log
const log = require('electron-log');
log.transports.file.level = isDev ? 'all' : 'all';
log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
log.transports.file.maxSize = 5 * 1024 * 1024;
/*by default it puts:
on Linux: ~/.config/<app name>/log.log
on OS X: ~/Library/Logs/<app name>/log.log
on Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log*/
//log.transports.file.file = 'ngeo-dm-log.log';

log.debug('isDev=' + isDev);

// auto uploader v1
const configuration = isDev ? require('./vendor/conf/configuration-dev.json') : require('./vendor/conf/configuration.json');

log.debug('appVersion=' + appVersion);

// operating system
let platform = os.platform();
log.debug('os=' + platform);

//const urlLatestDownloadManager = `${configuration.qsHost}/downloadManagers/releases/latest`;
const urlLatestDownloadManager = `http://localhost:3000/ngeo/downloadManagers/releases/latest`;

let firstLoading = true;

// browser-window creates a native window
let topWindow = null;
let mainWindow = null;
let mainTray = null;

let currentPath = '/tmp/';

// downloadItems
let downloadItems = [];
let downloadUrls = [];

// Don't show the app in the doc
if (app.dock) {
	//app.dock.hide();
}

/**
 * -------------------------------------------
 * IPC section
 * -------------------------------------------
 */
ipcMain.on('setCurrentPath', (event, arg) => {
	if (arg !== '') {
		currentPath = arg + '/';
		event.returnValue = 'set current path';
	}
});

ipcMain.on('OpenPath', (event, arg) => {
	if (arg !== '') {
		shell.showItemInFolder(arg);
	}
});

// start download
ipcMain.on('startDownloadRessource', (event, myRessource) => {
	log.debug('ipcMain.startDownloadRessource');
	let wc = mainWindow.webContents;
	ecp.download(myRessource, wc, currentPath);
});

// start download DAR
ipcMain.on('startECPDownloadDar', (event, myDar) => {
	log.debug('ipcMain.startECPDownloadDar');
	let wc = mainWindow.webContents;
	let _credentials = {
		username: settings.get('username'),
		password: settings.get('password')
	};
	myDar.productStatuses.forEach((product) => {
		ecp.downloadProduct(product.productURL, wc, currentPath, _credentials);
	});
});


// start download DAR
ipcMain.on('startDownloadDar', (event, myDar) => {
	log.debug('ipcMain.startDownloadDar');
	var wc = topWindow.webContents;
	myDar.productStatuses.forEach((product) => {
		let item = _getDownloadItemByUrl(product.productURL);
		if (item !== null && item.isPaused()) {
			log.debug('ipcMain.startDownloadDar item not null > resume it !');
			item.resume();
		} else {
			log.debug('ipcMain.startDownloadDar item null > download it !');
			log.debug('url: ' + product.productURL);

			wc.downloadURL(product.productURL);
		}
	});
});

// pause download DAR
ipcMain.on('pauseDownloadDar', (event, myDar) => {
	log.debug('ipcMain.pauseDownloadDar');
	var wc = topWindow.webContents;
	myDar.productStatuses.forEach((product) => {
		let item = _getDownloadItemByUrl(product.productURL);
		if (item !== null) {
			log.debug('ipcMain.cancelDownloadDar item not null > pause it !');
			item.pause();
		}
	});
});

// cancel download DAR
ipcMain.on('cancelDownloadDar', (event, myDar) => {
	log.debug('ipcMain.cancelDownloadDar');
	var wc = topWindow.webContents;
	myDar.productStatuses.forEach((product) => {
		let item = _getDownloadItemByUrl(product.productURL);
		if (item !== null) {
			log.debug('ipcMain.cancelDownloadDar item not null > cancel it !');
			item.cancel();
		}
	});
});

ipcMain.on('settings-choosepath', (event) => {
	let myPaths = dialog.showOpenDialog(mainWindow, {
		title: 'Choose path directory for downloads',
		properties: ['openDirectory']
	});
	if (typeof myPaths !== 'undefined') {
		event.sender.send('settings-choosepath-reply', myPaths[0]);
	}
});

ipcMain.on('settings-get', (event, arg) => {
	if (arg !== '') {
		let val = settings.get(arg);
		if (typeof val !== 'undefined') {
			event.returnValue = val;
		} else {
			event.returnValue = '';
		}
	}
});

ipcMain.on('settings-getall', (event, arg) => {
	event.returnValue = settings.getAll();
});

ipcMain.on('settings-set', (event, key, value) => {
	if ((key !== '') && (value !== '')) {
		settings.set(key, value);
		event.returnValue = 'done';
	}
});

/**
 * -------------------------------------------
 * AutoUpdater section
 * -------------------------------------------
 */
autoUpdater.on('error', (error) => {
	log.error(error);
});
autoUpdater.on('update-available', () => {
	let buttons = ["Update now", "Cancel"]
	log.info('A new update is available');
	dialog.showMessageBox(mainWindow, { type: 'warning', buttons: buttons, title: 'A new update is available...', message: 'A new update is available...' },
		function (buttonIndex) {
			if (buttonIndex == 0) {
				autoUpdater.quitAndInstall;
			} else {
				autoUpdater.quit;
			}
		});
});
autoUpdater.on('update-not-available', () => {
	log.warn('Update not available...');
	if (!firstLoading) {
		dialog.showMessageBox(mainWindow, { type: 'info', title: 'Check for update', message: 'Check for update ?', detail: 'There is no update available.' });
	}
	firstLoading = false;
});
autoUpdater.on('update-downloaded', () => {
	log.info('Update downloaded > quit and install !');
	autoUpdater.quitAndInstall();
});

autoUpdater.on('update-downloaded', (e) => {
	log.info(e);
	autoUpdater.quitAndInstall();
});

/**
 * -------------------------------------------
 * App section
 * -------------------------------------------
 */
app.on('ready', () => {

	// auto update v1
	autoUpdater.init(urlLatestDownloadManager);

	// create tray
	createTray();
	// create top window
	createTopWindow();
	// create window
	createWindow();
	// Ctrl + Q >> close and quit !
	globalShortcut.register('CommandOrControl+Q', () => {
		topWindow.close();
	})
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (topWindow === null) {
		createTopWindow();
		createWindow();
	}
});
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

/**
 * Create top window
 * @function createTopWindow
 */
const createTopWindow = () => {
	topWindow = new BrowserWindow({
		show: false
	});
	// Clear out the top window when the app is closed
	topWindow.on('closed', () => {
		topWindow = null;
	});

	topWindow.webContents.session.on('will-download', (event, item, webContents) => {

		log.debug('topWindow.willDownload');

		downloadItems.push(item);

		// Set the save path, making Electron not to prompt a save dialog.
		item.setSavePath(currentPath + item.getFilename());
		log.debug('savePath:' + currentPath + item.getFilename());

		item.on('updated', (event, state) => {
			log.info(item.getURLChain().length);
			if (state === 'interrupted') {
				log.info(`Download is interrupted but can be resumed for ${item.getURLChain()[0]}`)
			} else if (state === 'progressing') {
				if (item.isPaused()) {
					log.info(`Download is paused for ${item.getURLChain()[0]}`)
				} else {
					log.info(`Received bytes for ${item.getURLChain()[0]} : ${item.getReceivedBytes()}`)
					if (mainWindow) {
						log.debug('send downloadUpdated to mainWindow...');
						mainWindow.webContents.send('downloadUpdated', {
							url: item.getURLChain()[0],
							progress: item.getReceivedBytes() / item.getTotalBytes(),
							received: item.getReceivedBytes()
						});
					}
				}
			}
		})
		item.once('done', (event, state) => {
			if (state === 'completed') {
				log.info('Completed for ' + item.getURLChain()[0]);
				_delDownloadItemByUrl(item.getURLChain()[0]);
				if (mainWindow) {
					log.debug('send downloadCompleted to mainWindow...');
					mainWindow.webContents.send('downloadCompleted', {
						url: item.getURLChain()[0],
						path: currentPath + item.getFilename()
					});
				}
			} else {
				log.error(`Download failed for ${item.getURLChain()[0]}: ${state}`)
			}
		})
	})
};

/**
 *
 * @function createWindow
 *
 */
const createWindow = () => {
	if (mainWindow !== null) {
		//autoUpdater.checkForUpdates();
		mainWindow.autoUpdater = autoUpdater;
		mainWindow.show();
		return;
	}
	const pathIcon = __dirname + "/vendor/assets/icons/64x64.png";
	// Initialize the window to our specified dimensions
	mainWindow = new BrowserWindow({
		parent: topWindow,
		x: 100,
		y: 100,
		backgroundColor: '#FFFFFF',
		icon: pathIcon,
		show: false,
		minWidth: 800,
		minHeight: 600
	});

	// Tell Electron where to load the entry point from
	mainWindow.loadURL('file://' + __dirname + '/index.html');

	// Open the DevTools.
	//if (isDev) {
	mainWindow.webContents.openDevTools();
	//}

	// Show window when ready to show
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});

	// Clear out the main window when the app is closed
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

};

/**
 * Creates tray image & toggles window on click
 *
 * @function createTray
 */
const createTray = () => {
	mainTray = new Tray(__dirname + '/vendor/assets/icon.png');
	const contextMenu = Menu.buildFromTemplate([
		{ label: 'Show window', type: 'normal', click() { createWindow(); } },
		{ label: 'Check for update', type: 'normal', click() { autoUpdater.checkForUpdates(); } },
		{ label: 'About...', type: 'normal', click() { showAbout(); } },
		{ label: 'Quit', accelerator: 'CommandOrControl+Q', role: 'quit' }
	]);
	mainTray.setToolTip('ngEO Download Manager');
	mainTray.setContextMenu(contextMenu);
};

const showAbout = () => {
	dialog.showMessageBox(
		mainWindow, {
			type: 'info',
			title: 'About',
			message: 'Thanks to Irchad, to my Mum, to my cat Mimi, to Snow White and the Seven Dwarfs. Version ' + appVersion
		}
	);
}

/**
 * @function _getDownloadItemByUrl
 */
const _getDownloadItemByUrl = (myUrl) => {
	let _result = null;
	if (downloadItems) {
		log.debug('_getDownloadItemByUrl items.length ' + downloadItems.length);
		downloadItems.forEach((_item) => {
			if (_item.getURLChain()[0] === myUrl) {
				_result = _item;
			}
		});
	}
	log.debug('_getDownloadItemByUrl ' + _result);
	return _result;
}

/**
 * @function _delDownloadItemByUrl
 */
const _delDownloadItemByUrl = (myUrl) => {
	let _newDownloadItems = [];
	if (downloadItems) {
		log.debug('_delDownloadItemByUrl old array ' + downloadItems.length);
		downloadItems.forEach((_item) => {
			// getURLChain()[0] is the first url called
			if (_item.getURLChain()[0] !== myUrl) {
				_newDownloadItems.push(_item);
			}
		});
	}
	downloadItems = _newDownloadItems;
	log.debug('_delDownloadItemByUrl new array ' + downloadItems.length);
}