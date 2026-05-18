import { chromium } from "playwright";
import { app } from "electron";
import path from "node:path";
import fs from "node:fs";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const irctcUrl = "https://www.irctc.co.in/nget/train-search";
const algorithm = "aes-256-gcm";

export class SessionManager {
  constructor() {
    this.browser = undefined;
    this.context = undefined;
    this.page = undefined;
    this.sessionPath = path.join(app.getPath("userData"), "irctc-session.enc");
    this.secret = `${app.getPath("userData")}:irctc-session-vault`;
  }

  async openLogin() {
    await this.ensureBrowser(false);
    await this.page.goto(irctcUrl, { waitUntil: "domcontentloaded" });
    return { message: "IRCTC opened. Login manually, then save session." };
  }

  async saveSession() {
    if (!this.context) {
      throw new Error("No browser context available.");
    }

    const state = await this.context.storageState();
    fs.writeFileSync(this.sessionPath, this.encrypt(state), "utf8");
    return { message: "Encrypted IRCTC session saved." };
  }

  async restoreSession() {
    if (!fs.existsSync(this.sessionPath)) {
      throw new Error("No saved IRCTC session found.");
    }

    const state = this.decrypt(fs.readFileSync(this.sessionPath, "utf8"));
    await this.close();
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext({ storageState: state });
    this.page = await this.context.newPage();
    await this.page.goto(irctcUrl, { waitUntil: "domcontentloaded" });
    return { message: "IRCTC session restored." };
  }

  async dryRunSearch(journey) {
    if (!this.page) {
      await this.restoreSession();
    }

    await this.page.goto(irctcUrl, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);

    await this.fillStation("origin", journey.sourceStation);
    await this.fillStation("destination", journey.destinationStation);
    await this.fillDate(journey.travelDate);
    await this.pickDropdownText(journey.trainClass);
    await this.pickDropdownText(journey.quota === "TATKAL" ? "TATKAL" : journey.quota);

    return {
      message: `Dry run prepared search for ${journey.sourceStation} to ${journey.destinationStation}.`
    };
  }

  async verifySelectors() {
    if (!this.page) {
      await this.restoreSession();
    }

    await this.page.goto(irctcUrl, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);

    const checks = [
      { name: "origin station", found: await this.hasStation("origin") },
      { name: "destination station", found: await this.hasStation("destination") },
      { name: "journey date", found: await this.hasDate() },
      { name: "class/quota text", found: await this.page.getByText(/class|quota|tatkal/i).first().isVisible().catch(() => false) }
    ];
    const missing = checks.filter((check) => !check.found).map((check) => check.name);

    if (missing.length > 0) {
      return {
        ok: false,
        message: `Selector verification failed: ${missing.join(", ")} missing.`,
        checks
      };
    }

    return { ok: true, message: "Selector verification passed.", checks };
  }

  async close() {
    await this.browser?.close();
    this.browser = undefined;
    this.context = undefined;
    this.page = undefined;
  }

  async ensureBrowser(headless) {
    if (this.page) {
      return;
    }

    this.browser = await chromium.launch({ headless });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async fillStation(kind, value) {
    const labels =
      kind === "origin"
        ? [/from/i, /source/i, /origin/i]
        : [/to/i, /destination/i];
    const candidates = [
      ...labels.map((label) => this.page.getByLabel(label).first()),
      ...labels.map((label) => this.page.getByPlaceholder(label).first())
    ];

    for (const candidate of candidates) {
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.fill(value);
        await this.page.keyboard.press("Enter");
        return;
      }
    }
  }

  async hasStation(kind) {
    const labels =
      kind === "origin"
        ? [/from/i, /source/i, /origin/i]
        : [/to/i, /destination/i];
    const candidates = [
      ...labels.map((label) => this.page.getByLabel(label).first()),
      ...labels.map((label) => this.page.getByPlaceholder(label).first())
    ];

    for (const candidate of candidates) {
      if (await candidate.isVisible().catch(() => false)) {
        return true;
      }
    }

    return false;
  }

  async fillDate(travelDate) {
    const candidates = [
      this.page.getByLabel(/date/i).first(),
      this.page.getByPlaceholder(/date/i).first()
    ];

    for (const candidate of candidates) {
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.fill(travelDate);
        await this.page.keyboard.press("Enter");
        return;
      }
    }
  }

  async hasDate() {
    const candidates = [
      this.page.getByLabel(/date/i).first(),
      this.page.getByPlaceholder(/date/i).first()
    ];

    for (const candidate of candidates) {
      if (await candidate.isVisible().catch(() => false)) {
        return true;
      }
    }

    return false;
  }

  async pickDropdownText(text) {
    const option = this.page.getByText(text, { exact: false }).first();

    if (await option.isVisible().catch(() => false)) {
      await option.click();
    }
  }

  encrypt(payload) {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = scryptSync(this.secret, salt, 32);
    const cipher = createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(JSON.stringify(payload), "utf8")),
      cipher.final()
    ]);

    return Buffer.concat([salt, iv, cipher.getAuthTag(), encrypted]).toString("base64");
  }

  decrypt(encryptedPayload) {
    const packed = Buffer.from(encryptedPayload, "base64");
    const salt = packed.subarray(0, 16);
    const iv = packed.subarray(16, 28);
    const tag = packed.subarray(28, 44);
    const encrypted = packed.subarray(44);
    const key = scryptSync(this.secret, salt, 32);
    const decipher = createDecipheriv(algorithm, key, iv);

    decipher.setAuthTag(tag);

    return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8"));
  }
}
