const { app, BrowserWindow, globalShortcut, ipcMain, Menu, shell, Tray } = require('electron');

// browser-window creates a native window
let mainWindow = null;
let mainTray = null;

let currentPath = '/tmp/';

// Don't show the app in the doc
if (app.dock) {
  app.dock.hide();
}

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

app.on('ready', () => {
  createTray();
  createWindow();
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

const createWindow = () => {
  // Initialize the window to our specified dimensions
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    frame: true,
    resizable: true,
    transparent: true
  });

  // Tell Electron where to load the entry point from
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

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

// Creates tray image & toggles window on click
const createTray = () => {
  mainTray = new Tray('/home/omanoel/Documents/dev/ngEO-DM/src/assets/icon.png');
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Show window', type: 'normal', click() {toggleWindow();}},
    {label: 'Preferences', type: 'normal'},
    {label: 'About...', type: 'normal'},
    {label: 'Quit', accelerator: 'CommandOrControl+Q', role: 'quit'}
  ])
  mainTray.setToolTip('This is my application.')
  mainTray.setContextMenu(contextMenu)
  mainTray.on('click', function (event) {
    toggleWindow()
  });
};

const getWindowPosition = () => {
  const windowBounds = mainWindow.getBounds()
  const trayBounds = mainTray.getBounds()

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 3)

  return {x: x, y: y}
};

const showWindow = () => {
  const position = getWindowPosition()
  mainWindow.setPosition(position.x, position.y, false)
  mainWindow.show()
  mainWindow.focus()
};

const toggleWindow = () => {
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    showWindow()
  }
};
