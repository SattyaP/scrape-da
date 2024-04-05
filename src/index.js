const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs");
const { mainScrape, stopProccess } = require("./bot/main");
const production = process.env.NODE_ENV === "production" || false;
var Rollbar = require('rollbar')

if (require("electron-squirrel-startup")) {
  app.quit();
}

const rollbar = new Rollbar({
  accessToken: '11653e79452b4dcdaad379387cf4db97',
  captureUncaught: true,
  captureUnhandledRejections: true,
})

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 724,
    // TODO: Create icon
    icon: path.join(__dirname, './assets/icon.ico'),
    autoHideMenuBar: true,
    resizable: false,
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

ipcMain.on("start-bot", async (event, props) => {
  const logs = [];
  const prog = [];

  const handleInfo = (message) => {
    logs.push("[INFO] " + message);
    event.sender.send("log", logs.join("\n"));
  };

  const handleError = (error) => {
    if (production) {
      rollbar.error(error)
    } else {
      console.error(error);
    }
  };

  const PostTable = (results) => {
    event.sender.send("logToTable", results);
  };

  const proggress = (pros) => {
    prog.push(pros);
    event.sender.send("proggress", prog);
  };

  try {
    handleInfo("Bot started!");
    event.sender.send("run");
    await mainScrape(handleInfo, handleError, proggress, PostTable, props);
    handleInfo("Bot finished!");
    event.sender.send("finish", props);
  } catch (error) {
    handleError(error);
    event.sender.send("finish", props);
  }
});

ipcMain.on("stop", async (event) => {
  const logs = [];

  const handleInfo = (message) => {
    logs.push("[INFO] " + message);
    event.sender.send("log", logs.join("\n"));
  };

  stopProccess(handleInfo).then(event.sender.send("finish"));
});

