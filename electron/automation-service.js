export class AutomationService {
  #status = {
    state: "idle",
    message: "Automation engine ready.",
    browserEngine: "playwright-chromium"
  };

  getStatus() {
    return this.#status;
  }

  setBrowserEngine(browserEngine) {
    this.#status = {
      ...this.#status,
      browserEngine,
      message: `Browser engine set to ${browserEngine}.`
    };

    return this.#status;
  }
}
