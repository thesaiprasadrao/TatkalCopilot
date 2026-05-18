import Database from "better-sqlite3";
import { app } from "electron";
import path from "node:path";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const schema = `
CREATE TABLE IF NOT EXISTS journey_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_station TEXT NOT NULL,
  destination_station TEXT NOT NULL,
  travel_date TEXT NOT NULL,
  train_number TEXT NOT NULL,
  quota TEXT NOT NULL,
  train_class TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS passenger_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  encrypted_payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

const algorithm = "aes-256-gcm";

export class ProfileStore {
  constructor() {
    const dbPath = path.join(app.getPath("userData"), "tatkal-copilot.sqlite");
    this.database = new Database(dbPath);
    this.database.exec(schema);
    this.secret = `${app.getPath("userData")}:tatkal-copilot-local-vault`;
  }

  listJourneys() {
    return this.database
      .prepare("SELECT * FROM journey_profiles ORDER BY updated_at DESC")
      .all()
      .map((row) => ({
        id: row.id,
        name: row.name,
        sourceStation: row.source_station,
        destinationStation: row.destination_station,
        travelDate: row.travel_date,
        trainNumber: row.train_number,
        quota: row.quota,
        trainClass: row.train_class,
        paymentMethod: row.payment_method
      }));
  }

  saveJourney(profile) {
    const now = new Date().toISOString();

    this.database
      .prepare(
        `INSERT INTO journey_profiles (
          id, name, source_station, destination_station, travel_date,
          train_number, quota, train_class, payment_method, created_at, updated_at
        ) VALUES (
          @id, @name, @sourceStation, @destinationStation, @travelDate,
          @trainNumber, @quota, @trainClass, @paymentMethod, @now, @now
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          source_station = excluded.source_station,
          destination_station = excluded.destination_station,
          travel_date = excluded.travel_date,
          train_number = excluded.train_number,
          quota = excluded.quota,
          train_class = excluded.train_class,
          payment_method = excluded.payment_method,
          updated_at = excluded.updated_at`
      )
      .run({ ...profile, now });

    return profile;
  }

  listPassengers() {
    return this.database
      .prepare("SELECT encrypted_payload FROM passenger_profiles ORDER BY updated_at DESC")
      .all()
      .map((row) => this.decrypt(row.encrypted_payload));
  }

  savePassenger(profile) {
    const now = new Date().toISOString();
    const encryptedPayload = this.encrypt(profile);

    this.database
      .prepare(
        `INSERT INTO passenger_profiles (
          id, name, encrypted_payload, created_at, updated_at
        ) VALUES (
          @id, @name, @encryptedPayload, @now, @now
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          encrypted_payload = excluded.encrypted_payload,
          updated_at = excluded.updated_at`
      )
      .run({ id: profile.id, name: profile.name, encryptedPayload, now });

    return profile;
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
