import { describe, expect, it } from "vitest";
import { QUEUES, describeWorker } from "../src/index";

describe("worker bootstrap", () => {
  it("declares the expected queues", () => {
    expect(Object.values(QUEUES)).toContain("judge");
    expect(describeWorker()).toMatch(/judge/);
  });
});
