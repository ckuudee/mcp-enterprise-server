import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { SCHEMA_SQL } from "./schema.js";

export type Db = Database.Database;

/**
 * Writable handle, used only by the seed script. Pass ":memory:" for tests.
 * The MCP server must never use this; it opens the file with openReadOnly().
 */
export function createDatabase(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  return db;
}

/**
 * Read-only handle for the server. SQLite itself rejects any write on this
 * connection, so a bug in a tool still cannot modify data (defense in depth).
 */
export function openReadOnly(path: string): Db {
  return new Database(path, { readonly: true, fileMustExist: true });
}
