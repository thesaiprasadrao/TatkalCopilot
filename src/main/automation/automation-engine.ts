import type { Browser } from "playwright";
import {
  getBrowserAdapter,
  type BrowserEngine,
  type BrowserLaunchProfile
} from "./browser-adapters";

export type AutomationState = "idle" | "armed" | "running" | "paused" | "complete" | "error";

export type AutomationSnapshot = {
  state: AutomationState;
  message: string;
  browserEngine: BrowserEngine;
};

export class AutomationEngine {
  private browser?: Browser;
  private snapshot: AutomationSnapshot = {
    state: "idle",
    message: "Automation engine ready.",
    browserEngine: "playwright-chromium"
  };

  getStatus() {
    return this.snapshot;
  }

  configureBrowser(engine: BrowserEngine) {
    this.snapshot = {
      ...this.snapshot,
      browserEngine: engine,
      message: `Browser engine set to ${engine}.`
    };
  }

  async launchBrowser(profile?: Partial<BrowserLaunchProfile>) {
    const fullProfile: BrowserLaunchProfile = {
      engine: this.snapshot.browserEngine,
      headless: false,
      ...profile
    };
    const adapter = getBrowserAdapter(fullProfile.engine);

    this.snapshot = {
      ...this.snapshot,
      state: "running",
      message: `Launching ${adapter.label}.`
    };

    this.browser = await adapter.launch(fullProfile);
    this.snapshot = {
      ...this.snapshot,
      state: "idle",
      message: `${adapter.label} ready.`
    };

    return this.snapshot;
  }

  async stop() {
    await this.browser?.close();
    this.browser = undefined;
    this.snapshot = {
      ...this.snapshot,
      state: "idle",
      message: "Automation stopped."
    };
  }
}
