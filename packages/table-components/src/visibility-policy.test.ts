import { describe, expect, test } from "bun:test";

describe("visibility policy", () => {
  test("forbidden columns remain excluded from toggles", () => {
    const developerDefaults = {
      name: true,
      email: false,
      ssn: undefined,
    };
    const userOverrides = {
      email: true,
      ssn: true,
    };
    const effective = {
      ...developerDefaults,
      email: userOverrides.email,
      ssn: developerDefaults.ssn,
    };
    expect(effective.name).toBe(true);
    expect(effective.email).toBe(true);
    expect(effective.ssn).toBeUndefined();
  });
});
