import type { JourneyProfile, PassengerProfile } from "./profiles";

export type AutomationStatus = {
  state: "idle" | "armed" | "running" | "paused" | "complete" | "error";
  message: string;
  browserEngine?: "playwright-chromium" | "hardened-chromium" | "cloakbrowser";
};

export type TatkalCopilotApi = {
  getVersion: () => Promise<string>;
  getAutomationStatus: () => Promise<AutomationStatus>;
  setBrowserEngine: (browserEngine: NonNullable<AutomationStatus["browserEngine"]>) => Promise<AutomationStatus>;
  listJourneys: () => Promise<JourneyProfile[]>;
  saveJourney: (profile: JourneyProfile) => Promise<JourneyProfile>;
  listPassengers: () => Promise<PassengerProfile[]>;
  savePassenger: (profile: PassengerProfile) => Promise<PassengerProfile>;
};

declare global {
  interface Window {
    tatkalCopilot?: TatkalCopilotApi;
  }
}
