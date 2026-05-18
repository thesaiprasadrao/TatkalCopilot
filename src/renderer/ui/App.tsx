import { useEffect, useMemo, useState } from "react";
import type { AutomationStatus, BookingLog, ClockSyncResult } from "../../shared/electron-api";
import type { JourneyProfile, PassengerProfile } from "../../shared/profiles";

const runSteps = [
  "Restore IRCTC session",
  "Load saved journey",
  "Arm Tatkal quota",
  "Fill passenger details",
  "Pause for captcha",
  "Open payment fast lane"
];

const browserEngines = [
  { value: "playwright-chromium", label: "Playwright Chromium" },
  { value: "hardened-chromium", label: "Hardened Chromium" },
  { value: "cloakbrowser", label: "CloakBrowser" }
] as const;

const defaultJourney: JourneyProfile = {
  id: "default-journey",
  name: "Primary Tatkal run",
  sourceStation: "NDLS",
  destinationStation: "SBC",
  travelDate: new Date().toISOString().slice(0, 10),
  trainNumber: "12628",
  quota: "TATKAL",
  trainClass: "SL",
  paymentMethod: "UPI"
};

const defaultPassenger: PassengerProfile = {
  id: "default-passenger",
  name: "",
  age: 30,
  gender: "M",
  berthPreference: "LOWER"
};

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
  const [journey, setJourney] = useState<JourneyProfile>(defaultJourney);
  const [passenger, setPassenger] = useState<PassengerProfile>(defaultPassenger);
  const [savedPassengers, setSavedPassengers] = useState<PassengerProfile[]>([]);
  const [logs, setLogs] = useState<BookingLog[]>([]);
  const [clockSync, setClockSync] = useState<ClockSyncResult | null>(null);

  useEffect(() => {
    window.tatkalCopilot?.getAutomationStatus().then(setStatus).catch(() => {
      setStatus({ state: "error", message: "Electron bridge unavailable." });
    });
    window.tatkalCopilot?.listJourneys().then((journeys) => {
      if (journeys[0]) {
        setJourney(journeys[0]);
      }
    });
    window.tatkalCopilot?.listPassengers().then(setSavedPassengers);
    refreshLogs();

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

  async function saveJourney() {
    const savedJourney = await window.tatkalCopilot?.saveJourney(journey);

    if (savedJourney) {
      setJourney(savedJourney);
      setStatus({ ...status, message: "Journey profile saved." });
    }
  }

  async function refreshLogs() {
    const nextLogs = await window.tatkalCopilot?.listLogs();

    if (nextLogs) {
      setLogs(nextLogs);
    }
  }

  async function savePassenger() {
    if (!passenger.name.trim()) {
      setStatus({ ...status, state: "error", message: "Passenger name required." });
      return;
    }

    const savedPassenger = await window.tatkalCopilot?.savePassenger(passenger);
    const nextPassengers = await window.tatkalCopilot?.listPassengers();

    if (savedPassenger && nextPassengers) {
      setPassenger({ ...defaultPassenger, id: crypto.randomUUID() });
      setSavedPassengers(nextPassengers);
      setStatus({ ...status, state: "idle", message: "Passenger saved to encrypted vault." });
    }
  }

  async function runSessionAction(action: "openLogin" | "saveSession" | "restoreSession") {
    try {
      const result = await window.tatkalCopilot?.[action]();

      if (result) {
        setStatus({ ...status, state: "idle", message: result.message });
        refreshLogs();
      }
    } catch (error) {
      setStatus({
        ...status,
        state: "error",
        message: error instanceof Error ? error.message : "Session action failed."
      });
    }
  }

  async function runDryRun() {
    setStatus({ ...status, state: "running", message: "Starting IRCTC dry run." });

    try {
      const result = await window.tatkalCopilot?.dryRun(journey);

      if (result) {
        setStatus({ ...status, state: "idle", message: result.message });
        refreshLogs();
      }
    } catch (error) {
      setStatus({
        ...status,
        state: "error",
        message: error instanceof Error ? error.message : "Dry run failed."
      });
    }
  }

  async function verifySelectors() {
    setStatus({ ...status, state: "running", message: "Verifying IRCTC selectors." });

    try {
      const result = await window.tatkalCopilot?.verifySelectors();

      if (result) {
        setStatus({ ...status, state: result.ok ? "idle" : "error", message: result.message });
        refreshLogs();
      }
    } catch (error) {
      setStatus({
        ...status,
        state: "error",
        message: error instanceof Error ? error.message : "Selector verification failed."
      });
    }
  }

  async function syncClock() {
    setStatus({ ...status, state: "running", message: "Syncing clock." });

    try {
      const result = await window.tatkalCopilot?.syncClock();

      if (result) {
        setClockSync(result);
        setStatus({ ...status, state: "idle", message: result.message });
        refreshLogs();
      }
    } catch (error) {
      setStatus({
        ...status,
        state: "error",
        message: error instanceof Error ? error.message : "Clock sync failed."
      });
    }
  }

  async function armRun() {
    const nextStatus = await window.tatkalCopilot?.armRun();

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
            <button type="button" onClick={armRun}>
              Arm run
            </button>
            <button type="button" className="secondary" onClick={runDryRun}>
              Dry run
            </button>
            <button type="button" className="secondary" onClick={verifySelectors}>
              Verify selectors
            </button>
            <button type="button" className="secondary" onClick={syncClock}>
              Sync clock
            </button>
          </div>
          {clockSync ? (
            <p className="sync-copy">
              Drift {clockSync.driftMs}ms · latency {clockSync.latencyMs}ms
            </p>
          ) : null}
          <div className="session-actions">
            <button type="button" className="secondary" onClick={() => runSessionAction("openLogin")}>
              Open login
            </button>
            <button type="button" className="secondary" onClick={() => runSessionAction("saveSession")}>
              Save session
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => runSessionAction("restoreSession")}
            >
              Restore session
            </button>
          </div>
          <p className="safety-copy">Live booking clicks disabled until selector verification passes.</p>
        </div>

        <div className="journey-panel">
          <p className="panel-label">Journey profile</p>
          <h2>
            {journey.sourceStation} to {journey.destinationStation}
          </h2>
          <div className="form-grid">
            <label>
              <span>From</span>
              <input
                value={journey.sourceStation}
                onChange={(event) => setJourney({ ...journey, sourceStation: event.target.value })}
              />
            </label>
            <label>
              <span>To</span>
              <input
                value={journey.destinationStation}
                onChange={(event) =>
                  setJourney({ ...journey, destinationStation: event.target.value })
                }
              />
            </label>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={journey.travelDate}
                onChange={(event) => setJourney({ ...journey, travelDate: event.target.value })}
              />
            </label>
            <label>
              <span>Train</span>
              <input
                value={journey.trainNumber}
                onChange={(event) => setJourney({ ...journey, trainNumber: event.target.value })}
              />
            </label>
            <label>
              <span>Class</span>
              <select
                value={journey.trainClass}
                onChange={(event) =>
                  setJourney({ ...journey, trainClass: event.target.value as JourneyProfile["trainClass"] })
                }
              >
                <option>SL</option>
                <option>3A</option>
                <option>2A</option>
                <option>1A</option>
                <option>CC</option>
                <option>EC</option>
              </select>
            </label>
            <label>
              <span>Payment</span>
              <select
                value={journey.paymentMethod}
                onChange={(event) =>
                  setJourney({
                    ...journey,
                    paymentMethod: event.target.value as JourneyProfile["paymentMethod"]
                  })
                }
              >
                <option value="UPI">UPI</option>
                <option value="IRCTC_WALLET">IRCTC wallet</option>
                <option value="CARD">Card</option>
              </select>
            </label>
          </div>
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
          <button type="button" className="wide-action" onClick={saveJourney}>
            Save journey
          </button>
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
          <p className="panel-label">Run log</p>
          <div className="log-list">
            {logs.length === 0 ? (
              <p className="empty-copy">No runs yet.</p>
            ) : (
              logs.slice(0, 6).map((log) => (
                <article key={log.id}>
                  <strong>{log.state}</strong>
                  <span>{log.message}</span>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel">
          <p className="panel-label">Passenger vault</p>
          <div className="form-grid passenger-form">
            <label>
              <span>Name</span>
              <input
                value={passenger.name}
                onChange={(event) => setPassenger({ ...passenger, name: event.target.value })}
              />
            </label>
            <label>
              <span>Age</span>
              <input
                type="number"
                min="1"
                value={passenger.age}
                onChange={(event) => setPassenger({ ...passenger, age: Number(event.target.value) })}
              />
            </label>
            <label>
              <span>Gender</span>
              <select
                value={passenger.gender}
                onChange={(event) =>
                  setPassenger({ ...passenger, gender: event.target.value as PassengerProfile["gender"] })
                }
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="T">Transgender</option>
              </select>
            </label>
            <label>
              <span>Berth</span>
              <select
                value={passenger.berthPreference}
                onChange={(event) =>
                  setPassenger({
                    ...passenger,
                    berthPreference: event.target.value as PassengerProfile["berthPreference"]
                  })
                }
              >
                <option value="LOWER">Lower</option>
                <option value="MIDDLE">Middle</option>
                <option value="UPPER">Upper</option>
                <option value="SIDE_LOWER">Side lower</option>
                <option value="SIDE_UPPER">Side upper</option>
                <option value="ANY">Any</option>
              </select>
            </label>
          </div>
          <button type="button" className="wide-action" onClick={savePassenger}>
            Save passenger
          </button>
          <div className="passenger-list">
            {savedPassengers.map((passenger) => (
              <article key={passenger.id}>
                <strong>{passenger.name}</strong>
                <span>
                  Age {passenger.age}, {passenger.gender}, {passenger.berthPreference}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
