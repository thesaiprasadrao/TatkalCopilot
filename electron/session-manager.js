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
