/**
 * Player — the transport state machine (TRD §4.2 / app-flow §4):
 *
 *   idle → ready → playing ⇄ paused → finished
 *
 * Framework-agnostic and observable (subscribe/getSnapshot), so it drives React via
 * `useSyncExternalStore` while staying unit-testable with fake timers. It owns `frame`, `speed`,
 * and `status`; the *visual* state is derived separately and purely by `deriveState`.
 */
import type { Step, Trace } from "@algolens/algo-core";
import { clampFrame, deriveState, type VisualState } from "./visual-state";

export type PlayerStatus = "idle" | "ready" | "playing" | "paused" | "finished";

export interface PlayerSnapshot {
  status: PlayerStatus;
  frame: number;
  totalFrames: number;
  speed: number;
}

export const MIN_SPEED = 0.25;
export const MAX_SPEED = 4;
/** Base time per step at 1× (ms). Algorithm-motion budget per docs/05 §3 scales with speed. */
export const BASE_STEP_MS = 520;

const clampSpeed = (s: number): number => Math.max(MIN_SPEED, Math.min(MAX_SPEED, s));

export class Player {
  private trace: Trace | null = null;
  private frame = 0;
  private status: PlayerStatus = "idle";
  private speed = 1;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly listeners = new Set<() => void>();
  private snapshotCache: PlayerSnapshot | null = null;

  /** Load a freshly recorded trace and reset to frame 0 (the "re-record" edge → ready). */
  load(trace: Trace): void {
    this.clearTimer();
    this.trace = trace;
    this.frame = 0;
    this.status = "ready";
    this.emit();
  }

  get totalFrames(): number {
    return this.trace ? this.trace.steps.length : 0;
  }

  getSnapshot = (): PlayerSnapshot => {
    if (
      this.snapshotCache &&
      this.snapshotCache.status === this.status &&
      this.snapshotCache.frame === this.frame &&
      this.snapshotCache.totalFrames === this.totalFrames &&
      this.snapshotCache.speed === this.speed
    ) {
      return this.snapshotCache;
    }
    this.snapshotCache = {
      status: this.status,
      frame: this.frame,
      totalFrames: this.totalFrames,
      speed: this.speed,
    };
    return this.snapshotCache;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVisualState(): VisualState | null {
    return this.trace ? deriveState(this.trace, this.frame) : null;
  }

  get currentStep(): Step | null {
    if (!this.trace || this.frame < 1) return null;
    return this.trace.steps[this.frame - 1] ?? null;
  }

  play(): void {
    if (!this.trace || this.totalFrames === 0) return;
    if (this.status === "finished" || this.frame >= this.totalFrames) this.frame = 0;
    this.status = "playing";
    this.schedule();
    this.emit();
  }

  pause(): void {
    this.clearTimer();
    this.status = this.frame >= this.totalFrames ? "finished" : "paused";
    this.emit();
  }

  toggle(): void {
    if (this.status === "playing") this.pause();
    else this.play();
  }

  stepForward(): void {
    this.clearTimer();
    if (this.frame < this.totalFrames) this.frame += 1;
    this.status = this.frame >= this.totalFrames ? "finished" : "paused";
    this.emit();
  }

  stepBack(): void {
    this.clearTimer();
    if (this.frame > 0) this.frame -= 1;
    this.status = this.frame === 0 ? "ready" : "paused";
    this.emit();
  }

  seek(frame: number): void {
    if (!this.trace) return;
    this.clearTimer();
    this.frame = clampFrame(this.trace, frame);
    this.status =
      this.frame >= this.totalFrames ? "finished" : this.frame === 0 ? "ready" : "paused";
    this.emit();
  }

  setSpeed(speed: number): void {
    this.speed = clampSpeed(speed);
    if (this.status === "playing") this.schedule();
    this.emit();
  }

  reset(): void {
    this.clearTimer();
    this.frame = 0;
    this.status = this.trace ? "ready" : "idle";
    this.emit();
  }

  dispose(): void {
    this.clearTimer();
    this.listeners.clear();
  }

  private tick = (): void => {
    if (this.frame < this.totalFrames) this.frame += 1;
    if (this.frame >= this.totalFrames) {
      this.status = "finished";
      this.clearTimer();
    }
    this.emit();
  };

  private schedule(): void {
    this.clearTimer();
    this.timer = setInterval(this.tick, BASE_STEP_MS / this.speed);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
