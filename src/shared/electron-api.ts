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
  armRun: () => Promise<AutomationStatus>;
  blockLiveBooking: () => Promise<AutomationStatus>;
  listJourneys: () => Promise<JourneyProfile[]>;
  saveJourney: (profile: JourneyProfile) => Promise<JourneyProfile>;
  listPassengers: () => Promise<PassengerProfile[]>;
  savePassenger: (profile: PassengerProfile) => Promise<PassengerProfile>;
  openLogin: () => Promise<{ message: string }>;
  saveSession: () => Promise<{ message: string }>;
  restoreSession: () => Promise<{ message: string }>;
  dryRun: (journey: JourneyProfile) => Promise<{ message: string }>;
  listLogs: () => Promise<BookingLog[]>;
};

export type BookingLog = {
  id: string;
  state: AutomationStatus["state"];
  message: string;
  createdAt: string;
};

declare global {
  interface Window {
    tatkalCopilot?: TatkalCopilotApi;
  }
}
