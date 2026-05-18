export type AutomationStatus = {
  state: "idle" | "armed" | "running" | "paused" | "complete" | "error";
  message: string;
  browserEngine?: "playwright-chromium" | "hardened-chromium" | "cloakbrowser";
};

export type TatkalCopilotApi = {
  getVersion: () => Promise<string>;
  getAutomationStatus: () => Promise<AutomationStatus>;
  setBrowserEngine: (browserEngine: NonNullable<AutomationStatus["browserEngine"]>) => Promise<AutomationStatus>;
};

declare global {
  interface Window {
    tatkalCopilot?: TatkalCopilotApi;
  }
}
