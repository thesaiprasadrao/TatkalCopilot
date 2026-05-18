import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("tatkalCopilot", {
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  getAutomationStatus: () => ipcRenderer.invoke("automation:get-status"),
  setBrowserEngine: (browserEngine) => ipcRenderer.invoke("automation:set-browser-engine", browserEngine),
  listJourneys: () => ipcRenderer.invoke("profiles:list-journeys"),
  saveJourney: (profile) => ipcRenderer.invoke("profiles:save-journey", profile),
  listPassengers: () => ipcRenderer.invoke("profiles:list-passengers"),
  savePassenger: (profile) => ipcRenderer.invoke("profiles:save-passenger", profile)
});
