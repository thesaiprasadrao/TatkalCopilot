import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("tatkalCopilot", {
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  getAutomationStatus: () => ipcRenderer.invoke("automation:get-status"),
  setBrowserEngine: (browserEngine) => ipcRenderer.invoke("automation:set-browser-engine", browserEngine),
  armRun: () => ipcRenderer.invoke("automation:arm-run"),
  blockLiveBooking: () => ipcRenderer.invoke("automation:block-live-booking"),
  listJourneys: () => ipcRenderer.invoke("profiles:list-journeys"),
  saveJourney: (profile) => ipcRenderer.invoke("profiles:save-journey", profile),
  listPassengers: () => ipcRenderer.invoke("profiles:list-passengers"),
  savePassenger: (profile) => ipcRenderer.invoke("profiles:save-passenger", profile),
  openLogin: () => ipcRenderer.invoke("session:open-login"),
  saveSession: () => ipcRenderer.invoke("session:save"),
  restoreSession: () => ipcRenderer.invoke("session:restore"),
  dryRun: (journey) => ipcRenderer.invoke("automation:dry-run", journey),
  listLogs: () => ipcRenderer.invoke("logs:list")
});
