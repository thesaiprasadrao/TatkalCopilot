export type AutomationStatus = {
  state: "idle" | "armed" | "running" | "paused" | "complete" | "error";
  message: string;
};

export type TatkalCopilotApi = {
  getVersion: () => Promise<string>;
  getAutomationStatus: () => Promise<AutomationStatus>;
};

declare global {
  interface Window {
    tatkalCopilot?: TatkalCopilotApi;
  }
}
