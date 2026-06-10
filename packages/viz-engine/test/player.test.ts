import { bubbleSortSpec, recordTrace } from "@algolens/algo-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BASE_STEP_MS, Player } from "../src/state/player";

const trace = recordTrace(bubbleSortSpec, [5, 3, 8, 1]);

describe("Player state machine", () => {
  let player: Player;

  beforeEach(() => {
    vi.useFakeTimers();
    player = new Player();
  });

  afterEach(() => {
    player.dispose();
    vi.useRealTimers();
  });

  it("starts idle and becomes ready on load", () => {
    expect(player.getSnapshot().status).toBe("idle");
    player.load(trace);
    expect(player.getSnapshot()).toMatchObject({ status: "ready", frame: 0 });
    expect(player.totalFrames).toBe(trace.steps.length);
  });

  it("advances one frame per BASE_STEP_MS while playing", () => {
    player.load(trace);
    player.play();
    expect(player.getSnapshot().status).toBe("playing");
    vi.advanceTimersByTime(BASE_STEP_MS);
    expect(player.getSnapshot().frame).toBe(1);
    vi.advanceTimersByTime(BASE_STEP_MS * 3);
    expect(player.getSnapshot().frame).toBe(4);
  });

  it("doubles cadence at 2× speed", () => {
    player.load(trace);
    player.setSpeed(2);
    player.play();
    vi.advanceTimersByTime(BASE_STEP_MS); // one step at 1×, two at 2×
    expect(player.getSnapshot().frame).toBe(2);
  });

  it("clamps speed to [0.25, 4]", () => {
    player.load(trace);
    player.setSpeed(99);
    expect(player.getSnapshot().speed).toBe(4);
    player.setSpeed(0);
    expect(player.getSnapshot().speed).toBe(0.25);
  });

  it("reaches finished at the end and stops the timer", () => {
    player.load(trace);
    player.play();
    vi.advanceTimersByTime(BASE_STEP_MS * (trace.steps.length + 5));
    expect(player.getSnapshot().status).toBe("finished");
    expect(player.getSnapshot().frame).toBe(trace.steps.length);
  });

  it("restarts from 0 when play is pressed at the end", () => {
    player.load(trace);
    player.seek(trace.steps.length);
    expect(player.getSnapshot().status).toBe("finished");
    player.play();
    expect(player.getSnapshot().frame).toBe(0);
    expect(player.getSnapshot().status).toBe("playing");
  });

  it("pause/step/seek transitions are correct", () => {
    player.load(trace);
    player.play();
    player.pause();
    expect(player.getSnapshot().status).toBe("paused");
    player.stepForward();
    expect(player.getSnapshot().frame).toBe(1);
    player.stepBack();
    expect(player.getSnapshot()).toMatchObject({ frame: 0, status: "ready" });
    player.seek(3);
    expect(player.getSnapshot()).toMatchObject({ frame: 3, status: "paused" });
  });

  it("stepping does not run the timer", () => {
    player.load(trace);
    player.stepForward();
    vi.advanceTimersByTime(BASE_STEP_MS * 5);
    expect(player.getSnapshot().frame).toBe(1); // unchanged — not playing
  });

  it("notifies subscribers on change", () => {
    player.load(trace);
    const spy = vi.fn();
    const unsub = player.subscribe(spy);
    player.stepForward();
    expect(spy).toHaveBeenCalled();
    unsub();
    spy.mockClear();
    player.stepForward();
    expect(spy).not.toHaveBeenCalled();
  });
});
