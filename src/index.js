const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // titleBarStyle: "hidden",
    // titleBarOverlay: {
    //   color: "#fff",
    //   symbolColor: "#198754",
    // },
    // icon: path.join(__dirname, './assets/traffic-3.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: !app.isPackaged
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  app.isPackaged && Menu.setApplicationMenu(null)

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update_progress', progress.percent);
  });

  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-available', () => {
    updateCheckInProgress = false;
    mainWindow.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("halo", (event) => {
  event.sender.send("hai")
})

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', {
    version: app.getVersion()
  });
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});