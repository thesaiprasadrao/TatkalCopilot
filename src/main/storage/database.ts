import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const schemaPath = path.join(import.meta.dirname, "schema.sql");

export function openDatabase(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const database = new Database(filePath);
  const schema = fs.readFileSync(schemaPath, "utf8");
  database.exec(schema);

  return database;
}
