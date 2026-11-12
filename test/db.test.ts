import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase, openReadOnly } from "../src/db/client.js";
import { seedDatabase } from "../src/db/seed.js";

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("seedDatabase", () => {
  it("creates the requested number of users", () => {
    const db = createDatabase(":memory:");
    seedDatabase(db, 50);
    expect(db.prepare("SELECT COUNT(*) AS n FROM users").get()).toEqual({ n: 50 });
  });

  it("is deterministic across runs", () => {
    const a = createDatabase(":memory:");
    const b = createDatabase(":memory:");
    seedDatabase(a, 30);
    seedDatabase(b, 30);
    const sql = "SELECT * FROM users ORDER BY id";
    expect(a.prepare(sql).all()).toEqual(b.prepare(sql).all());
  });

  it("only uses reserved example.com emails", () => {
    const db = createDatabase(":memory:");
    seedDatabase(db, 100);
    const bad = db.prepare("SELECT COUNT(*) AS n FROM users WHERE email NOT LIKE '%@example.com'").get();
    expect(bad).toEqual({ n: 0 });
  });

  it("includes users who never logged in and users who logged in during 2026", () => {
    const db = createDatabase(":memory:");
    seedDatabase(db, 200);
    const never = db.prepare("SELECT COUNT(*) AS n FROM users WHERE last_login_at IS NULL").get() as { n: number };
    const recent = db.prepare("SELECT COUNT(*) AS n FROM users WHERE last_login_at >= '2026-01-01'").get() as { n: number };
    expect(never.n).toBeGreaterThan(0);
    expect(recent.n).toBeGreaterThan(0);
  });
});

describe("openReadOnly", () => {
  function makeSeededFile(): string {
    const dir = mkdtempSync(join(tmpdir(), "mcp-db-"));
    tempDirs.push(dir);
    const path = join(dir, "crm.sqlite");
    const db = createDatabase(path);
    seedDatabase(db, 10);
    db.close();
    return path;
  }

  it("can read data", () => {
    const db = openReadOnly(makeSeededFile());
    expect(db.prepare("SELECT COUNT(*) AS n FROM users").get()).toEqual({ n: 10 });
    db.close();
  });

  it("rejects writes at the database level", () => {
    const db = openReadOnly(makeSeededFile());
    expect(() => db.prepare("DELETE FROM users").run()).toThrow(/readonly/i);
    expect(() => db.exec("DROP TABLE users")).toThrow(/readonly/i);
    db.close();
  });

  it("refuses to create a missing database file", () => {
    expect(() => openReadOnly(join(tmpdir(), "does-not-exist-mcp.sqlite"))).toThrow();
  });
});
