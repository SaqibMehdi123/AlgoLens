import { describe, expect, it } from "vitest";
import { buildSeedRows } from "../src/seed";

describe("visualization seed", () => {
  it("derives one published row per registered algorithm with unique slugs", () => {
    const rows = buildSeedRows();
    expect(rows.length).toBeGreaterThanOrEqual(10);
    const slugs = new Set(rows.map((r) => r.slug));
    expect(slugs.size).toBe(rows.length);
    for (const row of rows) {
      expect(row.status).toBe("published");
      expect(row.pseudocode.length).toBeGreaterThan(0);
      expect(row.complexity).toHaveProperty("worst");
    }
  });
});
