const { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, shell, Tray } = require('electron');

const nativeImage = require('electron').nativeImage;

const isDev = process.env.TODO_DEV ? process.env.TODO_DEV.trim() == "true" : false;

let settings = require('electron-settings');

// log
const log = require('electron-log');
log.transports.file.level = 'warn';
log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
log.transports.file.maxSize = 5 * 1024 * 1024;
log.transports.file.file = __dirname + '/vendor/electron.log';

// auto uploader
const configuration = isDev ? require('./vendor/conf/configuration-dev.json') : require('./vendor/conf/configuration.json');
const appVersion = require('./package.json').version;
const os = require('os').platform();
const urlLatestDownloadManager = `${configuration.qsHost}/downloadManagers/releases/latest/`;
const updater = require('electron-simple-updater');
let firstLoading = true;

// browser-window creates a native window
let topWindow = null;
let mainWindow = null;
let mainTray = null;

let currentPath = '/tmp/';

// Don't show the app in the doc
if (app.dock) {
	app.dock.hide();
}

/**
 * -------------------------------------------
 * IPC section
 * -------------------------------------------
 */
ipcMain.on('setCurrentPath', (event, arg) => {
	if (arg !== '') {
		currentPath = arg;
		event.returnValue = 'set current path';
	}
});

ipcMain.on('OpenPath', (event, arg) => {
	if (arg !== '') {
		shell.showItemInFolder(arg);
	}
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
updater.on('error', (error) => {
	log.error(error);
});
updater.on('update-available', () => {
	dialog.showMessageBox(mainWindow, { type: 'warning', title: 'A new update is available...', message: 'A new update is available...' });
});
updater.on('update-not-available', () => {
	log.warn('Update not available...');
	if (!firstLoading) {
		dialog.showMessageBox(mainWindow, { type: 'info', title: 'Check for update', message: 'Check for update ?', detail: 'There is no update available.' });
	}
	firstLoading = false;
});
updater.on('update-downloaded', () => {
	updater.quitAndInstall();
});

/**
 * -------------------------------------------
 * App section
 * -------------------------------------------
 */
app.on('ready', () => {
	// auto update
	updater.init(urlLatestDownloadManager);

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
};

/**
 *
 * @function createWindow
 *
 */
const createWindow = () => {
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
	if (isDev) {
		mainWindow.webContents.openDevTools();
	}

	// Show window when ready to show
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});

	// Clear out the main window when the app is closed
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
		// Set the save path, making Electron not to prompt a save dialog.

		item.setSavePath(currentPath + item.getFilename())

		console.log(item.getSavePath());

		item.on('updated', (event, state) => {
			if (state === 'interrupted') {
				console.log('Download is interrupted but can be resumed')
			} else if (state === 'progressing') {
				if (item.isPaused()) {
					console.log('Download is paused')
				} else {
					console.log(`Received bytes: ${item.getReceivedBytes()}`)
				}
			}
		})
		item.once('done', (event, state) => {
			if (state === 'completed') {
				console.log('Download successfully')
			} else {
				console.log(`Download failed: ${state}`)
			}
		})
	})
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
		{ label: 'Preferences', type: 'normal' },
		{ label: 'Check for update', type: 'normal', click() { updater.checkForUpdates(); } },
		{ label: 'About...', type: 'normal', click() { showAbout(); } },
		{ label: 'Quit', accelerator: 'CommandOrControl+Q', role: 'quit' }
	]);
	mainTray.setToolTip('ngEO Download Manager');
	mainTray.setContextMenu(contextMenu);
};

const showAbout = () => {
	dialog.showMessageBox(mainWindow, { type: 'info', title: 'About', message: 'Thanks to Irchad, to my Mum, to my cat Mimi, to Snow White and the Seven Dwarfs.' });
}