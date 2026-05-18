import type Database from "better-sqlite3";
import type { JourneyProfile, PassengerProfile } from "../../shared/profiles";
import { decryptVaultPayload, encryptVaultPayload } from "../security/local-vault";

type JourneyRow = {
  id: string;
  name: string;
  source_station: string;
  destination_station: string;
  travel_date: string;
  train_number: string;
  quota: JourneyProfile["quota"];
  train_class: JourneyProfile["trainClass"];
  payment_method: JourneyProfile["paymentMethod"];
};

type PassengerRow = {
  id: string;
  name: string;
  encrypted_payload: string;
};

export class ProfileRepository {
  constructor(
    private readonly database: Database.Database,
    private readonly vaultSecret: string
  ) {}

  listJourneys() {
    const rows = this.database
      .prepare("SELECT * FROM journey_profiles ORDER BY updated_at DESC")
      .all() as JourneyRow[];

    return rows.map(toJourneyProfile);
  }

  saveJourney(profile: JourneyProfile) {
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
    const rows = this.database
      .prepare("SELECT * FROM passenger_profiles ORDER BY updated_at DESC")
      .all() as PassengerRow[];

    return rows.map((row) =>
      decryptVaultPayload<PassengerProfile>(row.encrypted_payload, this.vaultSecret)
    );
  }

  savePassenger(profile: PassengerProfile) {
    const now = new Date().toISOString();
    const encryptedPayload = encryptVaultPayload(profile, this.vaultSecret);

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
}

function toJourneyProfile(row: JourneyRow): JourneyProfile {
  return {
    id: row.id,
    name: row.name,
    sourceStation: row.source_station,
    destinationStation: row.destination_station,
    travelDate: row.travel_date,
    trainNumber: row.train_number,
    quota: row.quota,
    trainClass: row.train_class,
    paymentMethod: row.payment_method
  };
}
