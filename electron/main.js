import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AutomationService } from "./automation-service.js";
import { ProfileStore } from "./profile-store.js";
import { SessionManager } from "./session-manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.VITE_DEV_SERVER_URL || !app.isPackaged;

let mainWindow;
const automationService = new AutomationService();
let profileStore;
let sessionManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 960,
    minHeight: 640,
    title: "TatkalCopilot",
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist-renderer/index.html"));
  }
}

app.whenReady().then(() => {
  profileStore = new ProfileStore();
  sessionManager = new SessionManager();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("app:get-version", () => app.getVersion());
ipcMain.handle("automation:get-status", () => automationService.getStatus());
ipcMain.handle("automation:set-browser-engine", (_event, browserEngine) =>
  automationService.setBrowserEngine(browserEngine)
);
ipcMain.handle("profiles:list-journeys", () => profileStore.listJourneys());
ipcMain.handle("profiles:save-journey", (_event, profile) => profileStore.saveJourney(profile));
ipcMain.handle("profiles:list-passengers", () => profileStore.listPassengers());
ipcMain.handle("profiles:save-passenger", (_event, profile) => profileStore.savePassenger(profile));
ipcMain.handle("logs:list", () => profileStore.listLogs());
ipcMain.handle("session:open-login", async () => withLog("idle", () => sessionManager.openLogin()));
ipcMain.handle("session:save", async () => withLog("idle", () => sessionManager.saveSession()));
ipcMain.handle("session:restore", async () => withLog("idle", () => sessionManager.restoreSession()));
ipcMain.handle("automation:dry-run", async (_event, journey) =>
  withLog("running", () => sessionManager.dryRunSearch(journey))
);

async function withLog(state, action) {
  try {
    const result = await action();
    profileStore.addLog(state, result.message);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure.";
    profileStore.addLog("error", message);
    throw error;
  }
}
