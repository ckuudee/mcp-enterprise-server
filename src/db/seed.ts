import { rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createDatabase, type Db } from "./client.js";

const FIRST_NAMES = [
  "Ava", "Liam", "Noah", "Mia", "Ethan", "Zoe", "Lucas", "Ivy", "Mason", "Nora",
  "Owen", "Ruby", "Leo", "Cleo", "Jude", "Maya", "Finn", "Elsa", "Theo", "Rosa",
];
const LAST_NAMES = [
  "Park", "Nguyen", "Garcia", "Smith", "Patel", "Kim", "Brown", "Lopez", "Chen", "Davis",
  "Singh", "Moore", "Reyes", "Clark", "Young", "Ortiz", "Baker", "Silva", "Wood", "Hall",
];
const DEPARTMENTS = ["Sales", "Support", "Engineering", "Marketing", "Finance"];
const ORDER_STATUSES = ["pending", "paid", "refunded"] as const;

/** Small deterministic PRNG (mulberry32) so seed data is identical on every run. */
function makeRng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** ISO date (YYYY-MM-DD) `daysAfter` days after `start`. */
function addDays(start: string, daysAfter: number): string {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + daysAfter);
  return d.toISOString().slice(0, 10);
}

/**
 * Fill the database with fake CRM data. Every email uses the reserved
 * example.com domain, so no real person's data can appear here.
 */
export function seedDatabase(db: Db, userCount = 200): void {
  const rng = makeRng(42);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(rng() * items.length)]!;

  const insertUser = db.prepare(
    "INSERT INTO users (id, name, email, department, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const insertOrder = db.prepare(
    "INSERT INTO orders (user_id, amount_cents, status, created_at) VALUES (?, ?, ?, ?)",
  );

  db.transaction(() => {
    for (let id = 1; id <= userCount; id++) {
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      const createdAt = addDays("2024-01-01", Math.floor(rng() * 500));
      // ~10% never logged in; the rest last logged in somewhere in 2026.
      const lastLogin = rng() < 0.1 ? null : addDays("2026-01-01", Math.floor(rng() * 315));

      insertUser.run(
        id,
        `${first} ${last}`,
        `${first}.${last}.${id}@example.com`.toLowerCase(),
        pick(DEPARTMENTS),
        createdAt,
        lastLogin,
      );

      const orderCount = Math.floor(rng() * 4);
      for (let i = 0; i < orderCount; i++) {
        insertOrder.run(
          id,
          Math.floor(rng() * 50_000) + 500,
          pick(ORDER_STATUSES),
          addDays(createdAt, Math.floor(rng() * 300)),
        );
      }
    }
  })();
}

// Run directly (`npm run db:seed`): rebuild the file at DB_PATH from scratch.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const path = process.env.DB_PATH ?? "./data/crm.sqlite";
  rmSync(path, { force: true });
  const db = createDatabase(path);
  seedDatabase(db);
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  db.close();
  console.log(`Seeded ${n} users into ${path}`);
}
