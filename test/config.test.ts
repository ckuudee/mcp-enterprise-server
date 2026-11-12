import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

const validKey = "a".repeat(32);

describe("loadConfig", () => {
  it("applies defaults when only the API key is set", () => {
    const config = loadConfig({ API_KEY: validKey });
    expect(config).toEqual({
      PORT: 3000,
      API_KEY: validKey,
      DB_PATH: "./data/crm.sqlite",
      LOG_LEVEL: "info",
    });
  });

  it("coerces PORT from a string", () => {
    expect(loadConfig({ API_KEY: validKey, PORT: "8080" }).PORT).toBe(8080);
  });

  it("rejects a missing API key", () => {
    expect(() => loadConfig({})).toThrow(/API_KEY/);
  });

  it("rejects a short API key", () => {
    expect(() => loadConfig({ API_KEY: "changeme" })).toThrow(/at least 32/);
  });

  it("rejects an out-of-range PORT", () => {
    expect(() => loadConfig({ API_KEY: validKey, PORT: "70000" })).toThrow(/PORT/);
  });
});
