const { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, shell, Tray } = require('electron');

const nativeImage = require('electron').nativeImage;

// log
const log = require('electron-log');
log.transports.file.level = 'warn';
log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
log.transports.file.maxSize = 5 * 1024 * 1024;
log.transports.file.file = __dirname + '/log.txt';

// auto uploader
const configuration = require('./conf/configuration.json');
const appVersion = require('./package.json').version;
const os = require('os').platform();
const urlLatestDownloadManager = `${configuration.qsHost}/downloadManagers/releases/latest/`;
const updater = require('electron-simple-updater');


// browser-window creates a native window
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
})

ipcMain.on('OpenPath', (event, arg) => {
	if (arg !== '') {
		shell.showItemInFolder(arg);
	}
})

/**
 * -------------------------------------------
 * AutoUpdater section
 * -------------------------------------------
 */
updater.on('error', (error) => {
	log.error(error);
});
updater.on('update-available', () => {
	dialog.showMessageBox(mainWindow, {type: 'warning', title: 'A new update is available...', message: 'A new update is available...'});
});
updater.on('update-not-available', () => {
	log.warn('Update not available...');
	dialog.showMessageBox(mainWindow, {type: 'info', title:'No update available', message: 'No update available...'});
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
	// create window
	createWindow();
	// Ctrl + Q >> close and quit !
	globalShortcut.register('CommandOrControl+Q', () => {
		mainWindow.close();
	})
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
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
 *
 * @function createWindow
 *
 */
const createWindow = () => {
	const pathIcon = __dirname + "/assets/icons/64x64.png";
	// Initialize the window to our specified dimensions
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 900,
		backgroundColor: '#FFFFFF',
		center: true,
		closable: false,
		icon: pathIcon,
		show: false
	});

	// Tell Electron where to load the entry point from
	mainWindow.loadURL('file://' + __dirname + '/index.html');

	// Open the DevTools.
	//mainWindow.webContents.openDevTools();

	// Clear out the main window when the app is closed
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	// Hide the window when it loses focus
	mainWindow.on('blur', () => {
		if (!mainWindow.webContents.isDevToolsOpened()) {
			mainWindow.hide()
		}
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
	mainTray = new Tray(__dirname + '/assets/icon.png');
	const contextMenu = Menu.buildFromTemplate([
		{ label: 'Show window', type: 'normal', click() { toggleWindow(); } },
		{ label: 'Preferences', type: 'normal' },
		{ label: 'Check for update', type: 'normal', click() {updater.checkForUpdates();} },
		{ label: 'About...', type: 'normal', click() { showAbout(); } },
		{ label: 'Quit', accelerator: 'CommandOrControl+Q', role: 'quit' }
	])
	mainTray.setToolTip('This is my application.')
	mainTray.setContextMenu(contextMenu)
	mainTray.on('click', function (event) {
		toggleWindow()
	});
};

/**
 * @function getWindowPosition
 */
const getWindowPosition = () => {
	const windowBounds = mainWindow.getBounds()
	const trayBounds = mainTray.getBounds()

	// Center window horizontally below the tray icon
	const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

	// Position window 4 pixels vertically below the tray icon
	const y = Math.round(trayBounds.y + trayBounds.height + 3)

	return { x: x, y: y }
};

/**
 * @function showWindow
 */
const showWindow = () => {
	const position = getWindowPosition()
	mainWindow.setPosition(position.x, position.y, false)
	mainWindow.show()
	mainWindow.focus()
};

/**
 * @function toggleWindow
 */
const toggleWindow = () => {
	if (mainWindow.isVisible()) {
		mainWindow.hide()
	} else {
		showWindow()
	}
};

const showAbout = () => {
	dialog.showMessageBox(mainWindow, {type: 'info', title:'About', message: 'Thanks to Irchad, to my Mum, to my cat Mimi and all together, you can made this reality !'});
}