import { existsSync } from "node:fs";
import { join } from "node:path";
import { app, BrowserWindow } from "electron";
import started from "electron-squirrel-startup";

// Handle Squirrel.Windows install/update/uninstall events
if (started) {
  app.quit();
}

// Check if the bundled renderer exists to determine dev vs production mode
const rendererPath = join(__dirname, "../renderer/index.html");
const isDev = !existsSync(rendererPath);

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // In dev mode, load the Vite dev server URL for the frontend
    mainWindow.loadURL("http://localhost:5177");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the bundled frontend from the renderer directory
    mainWindow.loadFile(rendererPath);
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On macOS, re-create window when dock icon is clicked and no windows exist
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // On macOS, apps typically stay active until the user quits explicitly
  if (process.platform !== "darwin") {
    app.quit();
  }
});
