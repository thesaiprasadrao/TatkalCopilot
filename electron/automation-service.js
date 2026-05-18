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

  armRun() {
    this.#status = {
      ...this.#status,
      state: "armed",
      message: "Run armed. Live booking actions remain disabled until safety gate is enabled."
    };

    return this.#status;
  }

  blockLiveBooking() {
    this.#status = {
      ...this.#status,
      state: "paused",
      message: "Live booking blocked by safety gate. Use dry run until selectors are verified."
    };

    return this.#status;
  }
}
