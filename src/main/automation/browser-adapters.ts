import { chromium, type Browser, type LaunchOptions } from "playwright";

export type BrowserEngine = "playwright-chromium" | "hardened-chromium" | "cloakbrowser";

export type BrowserLaunchProfile = {
  engine: BrowserEngine;
  headless: boolean;
  executablePath?: string;
  userDataDir?: string;
};

export type BrowserAdapter = {
  engine: BrowserEngine;
  label: string;
  experimental: boolean;
  launch(profile: BrowserLaunchProfile): Promise<Browser>;
};

function toLaunchOptions(profile: BrowserLaunchProfile): LaunchOptions {
  return {
    headless: profile.headless,
    executablePath: profile.executablePath,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-first-run"
    ]
  };
}

export const standardChromiumAdapter: BrowserAdapter = {
  engine: "playwright-chromium",
  label: "Standard Playwright Chromium",
  experimental: false,
  launch(profile) {
    return chromium.launch(toLaunchOptions(profile));
  }
};

export const hardenedChromiumAdapter: BrowserAdapter = {
  engine: "hardened-chromium",
  label: "Hardened Chromium",
  experimental: true,
  launch(profile) {
    if (!profile.executablePath) {
      throw new Error("Hardened Chromium requires executablePath.");
    }

    return chromium.launch(toLaunchOptions(profile));
  }
};

export const cloakBrowserAdapter: BrowserAdapter = {
  engine: "cloakbrowser",
  label: "CloakBrowser",
  experimental: true,
  launch(profile) {
    if (!profile.executablePath) {
      throw new Error("CloakBrowser requires executablePath.");
    }

    return chromium.launch(toLaunchOptions(profile));
  }
};

const adapters = new Map<BrowserEngine, BrowserAdapter>([
  [standardChromiumAdapter.engine, standardChromiumAdapter],
  [hardenedChromiumAdapter.engine, hardenedChromiumAdapter],
  [cloakBrowserAdapter.engine, cloakBrowserAdapter]
]);

export function getBrowserAdapter(engine: BrowserEngine = "playwright-chromium") {
  const adapter = adapters.get(engine);

  if (!adapter) {
    throw new Error(`Unsupported browser engine: ${engine}`);
  }

  return adapter;
}
