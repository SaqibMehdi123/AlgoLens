import { afterEach, describe, expect, it } from "vitest";
import { __resetRateLimits, clientKey, rateLimit } from "../src/lib/rate-limit";

afterEach(() => __resetRateLimits());

describe("rateLimit (sliding window)", () => {
  it("allows up to the limit, then blocks", () => {
    const t = 1_000_000;
    for (let i = 0; i < 6; i++) {
      expect(rateLimit("sub:ip", 6, 60_000, t).ok).toBe(true);
    }
    const blocked = rateLimit("sub:ip", 6, 60_000, t);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBe(60_000);
  });

  it("frees slots as the window slides", () => {
    const t = 1_000_000;
    for (let i = 0; i < 6; i++) rateLimit("k", 6, 60_000, t + i * 1000);
    // 60s after the first hit, that hit ages out → one slot free.
    expect(rateLimit("k", 6, 60_000, t + 60_001).ok).toBe(true);
  });

  it("isolates buckets by key", () => {
    const t = 1_000_000;
    for (let i = 0; i < 6; i++) rateLimit("a", 6, 60_000, t);
    expect(rateLimit("a", 6, 60_000, t).ok).toBe(false);
    expect(rateLimit("b", 6, 60_000, t).ok).toBe(true);
  });

  it("reports remaining slots", () => {
    const t = 1_000_000;
    expect(rateLimit("r", 3, 1000, t).remaining).toBe(2);
    expect(rateLimit("r", 3, 1000, t).remaining).toBe(1);
    expect(rateLimit("r", 3, 1000, t).remaining).toBe(0);
  });
});

describe("clientKey", () => {
  it("prefers the first x-forwarded-for hop", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientKey(req)).toBe("1.2.3.4");
  });
  it("falls back to local", () => {
    expect(clientKey(new Request("http://x"))).toBe("local");
  });
});
