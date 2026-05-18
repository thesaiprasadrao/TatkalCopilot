import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("tatkalCopilot", {
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  getAutomationStatus: () => ipcRenderer.invoke("automation:get-status")
});
