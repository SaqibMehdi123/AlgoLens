import { describe, expect, it } from "vitest";
import { problem, problemJson, vizInputConfig } from "../src";

describe("problem+json", () => {
  it("builds a valid RFC 7807 body", () => {
    const p = problem(404, "Not Found", "no such lesson");
    expect(problemJson.parse(p)).toMatchObject({ status: 404, title: "Not Found" });
  });
});

describe("vizInputConfig", () => {
  it("accepts a valid array config and applies the default order", () => {
    const parsed = vizInputConfig.parse({ type: "array", n: 12 });
    expect(parsed).toMatchObject({ type: "array", n: 12, order: "random" });
  });

  it("rejects an oversized array", () => {
    expect(() => vizInputConfig.parse({ type: "array", n: 9999 })).toThrow();
  });

  it("discriminates on type", () => {
    const g = vizInputConfig.parse({ type: "graph", start: "A" });
    expect(g.type).toBe("graph");
  });
});
