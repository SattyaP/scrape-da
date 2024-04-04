const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const production = process.env.NODE_ENV === "production" || false;

if (require("electron-squirrel-startup")) {
  app.quit();
}

function handleInfo(message) {
  if (production) {
    log("[INFO] " + message);
  } else {
    console.log(message);
  }
}

function handleError(message) {
  if (production) {
    log("[ERROR] " + message);
  } else {
    console.error(message);
  }
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 724,
    // titleBarStyle: "hidden",
    // titleBarOverlay: {
    //   color: "#fff",
    //   symbolColor: "#198754",
    // },
    // icon: path.join(__dirname, './assets/traffic-3.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: !app.isPackaged,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  app.isPackaged && Menu.setApplicationMenu(null);

  autoUpdater.on("download-progress", (progress) => {
    mainWindow.webContents.send("update_progress", progress.percent);
  });

  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on("update-available", () => {
    updateCheckInProgress = false;
    mainWindow.webContents.send("update_available");
  });

  autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("update_downloaded");
  });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("app_version", (event) => {
  event.sender.send("app_version", {
    version: app.getVersion(),
  });
});

ipcMain.on("restart_app", () => {
  autoUpdater.quitAndInstall();
});
