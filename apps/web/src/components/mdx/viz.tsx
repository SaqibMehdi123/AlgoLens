"use client";

import { getAlgo, type Json } from "@algolens/algo-core";
import {
  deriveState,
  describeStep,
  Player,
  Scene,
  usePlayerSnapshot,
  type Trace,
} from "@algolens/viz-engine";
import { ExternalLink, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export interface VizProps {
  algo: string;
  /** Array/tree values; omitted → the algorithm's default input. */
  values?: number[];
  target?: number;
  /** Initial frame to open at — "a meaningful snapshot", per the lesson template. */
  frame?: number;
  caption?: string;
}

function buildVizInput(algo: string, values?: number[], target?: number): Json | undefined {
  if (!values) return undefined; // registry default
  const entry = getAlgo(algo);
  if (!entry) return undefined;
  if (entry.category === "searching") {
    const sorted = algo === "binary-search" ? [...values].sort((a, b) => a - b) : values;
    return { array: sorted, target: target ?? sorted[0] ?? 0 };
  }
  if (algo === "bst-search") return { values, target: target ?? values[0] ?? 0 };
  return values;
}

function playgroundHref(p: VizProps, frame: number): string {
  const q = new URLSearchParams();
  if (p.values) q.set("v", p.values.join(","));
  if (p.target != null) q.set("target", String(p.target));
  if (frame > 0) q.set("frame", String(frame));
  const qs = q.toString();
  return `/visualize/${p.algo}${qs ? `?${qs}` : ""}`;
}

/**
 * <Viz/> — an embedded mini-visualizer for lessons (PRD B1). Same engine as the playground,
 * compact transport, opens at a meaningful frame, full-width breakout from the prose column.
 */
export function Viz(props: VizProps) {
  const { algo, values, target, frame = 0, caption } = props;
  const playerRef = useRef<Player | null>(null);
  if (!playerRef.current) playerRef.current = new Player();
  const player = playerRef.current;
  const [trace, setTrace] = useState<Trace | null>(null);
  const snapshot = usePlayerSnapshot(player);

  useEffect(() => {
    const entry = getAlgo(algo);
    if (!entry) return;
    const input = buildVizInput(algo, values, target);
    const t = entry.record(input);
    setTrace(t);
    player.load(t);
    if (frame > 0) player.seek(frame);
    return () => player.dispose();
    // Props come from static MDX — they never change after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  const visualState = useMemo(
    () => (trace ? deriveState(trace, snapshot.frame) : null),
    [trace, snapshot.frame],
  );

  const caption2 =
    trace && snapshot.frame >= 1 && trace.steps[snapshot.frame - 1]
      ? describeStep(trace.steps[snapshot.frame - 1]!)
      : null;

  if (!getAlgo(algo)) {
    return <p className="text-sm text-swap">Unknown visualization: {algo}</p>;
  }

  const btn =
    "grid size-8 shrink-0 place-items-center rounded-lg bg-raised text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <figure className="not-prose my-8 rounded-xl border border-subtle bg-surface p-3">
      <div className="grid min-h-[220px] place-items-center">
        {visualState ? (
          <Scene state={visualState} className="max-h-[280px]" />
        ) : (
          <div className="animate-pulse font-mono text-sm text-muted">recording trace…</div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => player.toggle()}
          aria-label={snapshot.status === "playing" ? "Pause" : "Play"}
        >
          {snapshot.status === "playing" ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => player.stepBack()}
          disabled={snapshot.frame === 0}
          aria-label="Step back"
        >
          <SkipBack className="size-4" />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => player.stepForward()}
          disabled={snapshot.frame >= snapshot.totalFrames}
          aria-label="Step forward"
        >
          <SkipForward className="size-4" />
        </button>
        <input
          type="range"
          min={0}
          max={snapshot.totalFrames}
          value={snapshot.frame}
          onChange={(e) => player.seek(Number(e.target.value))}
          aria-label="Scrub steps"
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-raised accent-[var(--primary)]"
        />
        <span className="font-mono text-xs tabular-nums text-secondary">
          {snapshot.frame}/{snapshot.totalFrames}
        </span>
        <Link
          href={playgroundHref(props, snapshot.frame)}
          className="ml-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" />
          Playground
        </Link>
      </div>

      <p aria-live="polite" className="mt-1.5 min-h-[1.25rem] font-mono text-xs text-muted">
        {caption2 ?? ""}
      </p>
      {caption && (
        <figcaption className="mt-1 text-sm text-secondary">{caption}</figcaption>
      )}
    </figure>
  );
}
