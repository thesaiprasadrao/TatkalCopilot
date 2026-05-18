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

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS booking_logs (
  id TEXT PRIMARY KEY,
  journey_profile_id TEXT,
  state TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);
