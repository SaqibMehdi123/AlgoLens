"use client";

import { getAlgo } from "@algolens/algo-core";
import {
  deriveState,
  describeStep,
  MAX_SPEED,
  MIN_SPEED,
  Player,
  Scene,
  usePlayerSnapshot,
  type Trace,
} from "@algolens/viz-engine";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildInput, defaultControls, type ArrayOrder, type ControlState } from "@/lib/input";
import { InputControls } from "./input-controls";
import { LiveRegion } from "./live-region";
import { RightRail } from "./right-rail";
import { TransportBar } from "./transport-bar";

const SPEED_STEPS = [0.25, 0.5, 1, 2, 4];

function controlsToParams(c: ControlState, frame: number): string {
  const p = new URLSearchParams();
  p.set("n", String(c.size));
  p.set("order", c.order);
  if (c.target != null) p.set("target", String(c.target));
  p.set("seed", String(c.seed));
  if (c.customValues) p.set("v", c.customValues.join(","));
  if (frame > 0) p.set("frame", String(frame));
  return p.toString();
}

function paramsToControls(
  search: string,
  base: ControlState,
): { controls: ControlState; frame: number } {
  const p = new URLSearchParams(search);
  const controls: ControlState = { ...base };
  if (p.has("n")) controls.size = Number(p.get("n"));
  if (p.has("order")) controls.order = p.get("order") as ArrayOrder;
  if (p.has("target")) controls.target = Number(p.get("target"));
  if (p.has("seed")) controls.seed = Number(p.get("seed"));
  if (p.has("v"))
    controls.customValues = p
      .get("v")!
      .split(",")
      .map(Number)
      .filter(Number.isFinite);
  return { controls, frame: p.has("frame") ? Number(p.get("frame")) : 0 };
}

export function PlayerShell({ algoKey }: { algoKey: string }) {
  const entry = getAlgo(algoKey);

  const playerRef = useRef<Player | null>(null);
  if (!playerRef.current) playerRef.current = new Player();
  const player = playerRef.current;

  const [controls, setControls] = useState<ControlState>(() =>
    entry ? defaultControls(entry) : { size: 12, order: "random", customValues: null, target: null, seed: 1 },
  );
  const [trace, setTrace] = useState<Trace | null>(null);
  const [reduced, setReduced] = useState(false);
  const [shared, setShared] = useState(false);
  const pendingFrame = useRef(0);

  const snapshot = usePlayerSnapshot(player);

  // Hydrate from a shared URL once (client only — window is unavailable during SSR).
  useEffect(() => {
    if (!entry || !window.location.search) return;
    const { controls: c, frame } = paramsToControls(window.location.search, defaultControls(entry));
    pendingFrame.current = frame;
    setControls(c);
  }, []);

  // Record a fresh trace whenever the input controls change, then (re)load the player.
  useEffect(() => {
    if (!entry) return;
    const t = entry.record(buildInput(entry, controls));
    setTrace(t);
    player.load(t);
    if (pendingFrame.current > 0) {
      player.seek(pendingFrame.current);
      pendingFrame.current = 0;
    }
  }, [entry, controls, player]);

  // Detect the OS reduced-motion preference as the initial value.
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Keyboard transport map (docs/05 §5.3): space, ←/→ step, ↑/↓ speed.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const speed = player.getSnapshot().speed;
      const idx = SPEED_STEPS.indexOf(speed);
      switch (e.key) {
        case " ":
          e.preventDefault();
          player.toggle();
          break;
        case "ArrowRight":
          e.preventDefault();
          player.stepForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          player.stepBack();
          break;
        case "ArrowUp":
          e.preventDefault();
          player.setSpeed(SPEED_STEPS[Math.min(idx + 1, SPEED_STEPS.length - 1)] ?? MAX_SPEED);
          break;
        case "ArrowDown":
          e.preventDefault();
          player.setSpeed(SPEED_STEPS[Math.max(idx - 1, 0)] ?? MIN_SPEED);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player]);

  useEffect(() => () => player.dispose(), [player]);

  const visualState = useMemo(
    () => (trace ? deriveState(trace, snapshot.frame) : null),
    [trace, snapshot.frame],
  );

  const caption = useMemo(() => {
    if (!trace || snapshot.frame < 1) return null;
    const step = trace.steps[snapshot.frame - 1];
    return step ? describeStep(step) : null;
  }, [trace, snapshot.frame]);

  function handleShare() {
    const qs = controlsToParams(controls, snapshot.frame);
    const url = `${window.location.origin}${window.location.pathname}?${qs}`;
    window.history.replaceState(null, "", `?${qs}`);
    void navigator.clipboard?.writeText(url).catch(() => undefined);
    setShared(true);
    window.setTimeout(() => setShared(false), 1500);
  }

  if (!entry) {
    return <p className="py-12 text-center text-muted">Unknown algorithm: {algoKey}</p>;
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="rounded-xl border border-subtle bg-surface px-3.5 py-3">
        <InputControls
          entry={entry}
          controls={controls}
          onChange={(next) => setControls((c) => ({ ...c, ...next }))}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <div className="grid min-h-[440px] place-items-center rounded-xl border border-subtle bg-[color-mix(in_srgb,var(--surface)_55%,transparent)] p-4">
          {visualState ? (
            <Scene state={visualState} animate={!reduced} className="max-h-[480px]" />
          ) : (
            <div className="animate-pulse font-mono text-sm text-muted">recording trace…</div>
          )}
        </div>

        <RightRail
          title={entry.title}
          category={entry.category}
          complexity={entry.complexity}
          pseudocode={entry.pseudocode}
          currentLine={visualState?.currentLine ?? null}
          vars={visualState?.vars ?? {}}
          callStack={visualState?.callStack ?? []}
          annotation={visualState?.annotation ?? null}
        />
      </div>

      <TransportBar player={player} snapshot={snapshot} onShare={handleShare} shared={shared} />
      <LiveRegion
        caption={caption}
        reducedMotion={reduced}
        onToggleReduced={() => setReduced((r) => !r)}
      />
    </div>
  );
}
