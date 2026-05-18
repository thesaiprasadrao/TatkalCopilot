import { useEffect, useMemo, useState } from "react";
import type { AutomationStatus } from "../../shared/electron-api";

const runSteps = [
  "Restore IRCTC session",
  "Load saved journey",
  "Arm Tatkal quota",
  "Fill passenger details",
  "Pause for captcha",
  "Open payment fast lane"
];

const passengers = [
  { name: "Passenger 1", detail: "Adult, lower berth preferred" },
  { name: "Passenger 2", detail: "Adult, any berth" }
];

const browserEngines = [
  { value: "playwright-chromium", label: "Playwright Chromium" },
  { value: "hardened-chromium", label: "Hardened Chromium" },
  { value: "cloakbrowser", label: "CloakBrowser" }
] as const;

function getCountdown() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(11, 0, 0, 0);

  if (target.getTime() < now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const remaining = Math.max(0, target.getTime() - now.getTime());
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function App() {
  const [status, setStatus] = useState<AutomationStatus>({
    state: "idle",
    message: "Waiting for setup."
  });
  const [countdown, setCountdown] = useState(getCountdown);

  useEffect(() => {
    window.tatkalCopilot?.getAutomationStatus().then(setStatus).catch(() => {
      setStatus({ state: "error", message: "Electron bridge unavailable." });
    });

    const interval = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const statusLabel = useMemo(() => status.state.toUpperCase(), [status.state]);

  async function handleBrowserChange(browserEngine: (typeof browserEngines)[number]["value"]) {
    const nextStatus = await window.tatkalCopilot?.setBrowserEngine(browserEngine);

    if (nextStatus) {
      setStatus(nextStatus);
    }
  }

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">TatkalCopilot</p>
          <h1>Booking cockpit</h1>
        </div>
        <div className={`status-pill status-${status.state}`}>{statusLabel}</div>
      </section>

      <section className="command-grid">
        <div className="countdown-panel">
          <p className="panel-label">Tatkal opens in</p>
          <div className="countdown">{countdown}</div>
          <p className="status-copy">{status.message}</p>
          <div className="action-row">
            <button type="button">Arm run</button>
            <button type="button" className="secondary">
              Dry run
            </button>
          </div>
        </div>

        <div className="journey-panel">
          <p className="panel-label">Journey profile</p>
          <h2>NDLS to SBC</h2>
          <dl>
            <div>
              <dt>Train</dt>
              <dd>12628 Karnataka Express</dd>
            </div>
            <div>
              <dt>Class</dt>
              <dd>SL</dd>
            </div>
            <div>
              <dt>Quota</dt>
              <dd>Tatkal</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>UPI preferred</dd>
            </div>
          </dl>
          <label className="browser-select">
            <span>Browser engine</span>
            <select
              value={status.browserEngine ?? "playwright-chromium"}
              onChange={(event) =>
                handleBrowserChange(event.target.value as (typeof browserEngines)[number]["value"])
              }
            >
              {browserEngines.map((engine) => (
                <option key={engine.value} value={engine.value}>
                  {engine.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel">
          <p className="panel-label">Automation pipeline</p>
          <ol className="step-list">
            {runSteps.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="panel">
          <p className="panel-label">Passenger vault</p>
          <div className="passenger-list">
            {passengers.map((passenger) => (
              <article key={passenger.name}>
                <strong>{passenger.name}</strong>
                <span>{passenger.detail}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
