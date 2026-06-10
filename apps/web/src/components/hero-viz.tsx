"use client";

import { getAlgo } from "@algolens/algo-core";
import {
  deriveState,
  Player,
  Scene,
  usePlayerSnapshot,
  type Trace,
} from "@algolens/viz-engine";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/** The landing hero: a real, auto-playing, scrubbable 9-bar merge sort (docs/05 §5.1). */
export function HeroViz() {
  const playerRef = useRef<Player | null>(null);
  if (!playerRef.current) playerRef.current = new Player();
  const player = playerRef.current;
  const [trace, setTrace] = useState<Trace | null>(null);
  const snapshot = usePlayerSnapshot(player);

  useEffect(() => {
    const entry = getAlgo("merge-sort");
    if (!entry) return;
    const t = entry.record([5, 2, 8, 3, 9, 1, 6, 4, 7]);
    setTrace(t);
    player.load(t);
    player.play();
    return () => player.dispose();
  }, [player]);

  // Loop the demo for a calm, ambient hero.
  useEffect(() => {
    if (snapshot.status !== "finished") return;
    const id = window.setTimeout(() => {
      player.reset();
      player.play();
    }, 1600);
    return () => window.clearTimeout(id);
  }, [snapshot.status, player]);

  const visualState = useMemo(
    () => (trace ? deriveState(trace, snapshot.frame) : null),
    [trace, snapshot.frame],
  );

  return (
    <div className="rounded-2xl border border-subtle bg-surface p-4 shadow-sm">
      <div className="grid min-h-[260px] place-items-center">
        {visualState && <Scene state={visualState} className="max-h-[300px]" />}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => player.toggle()}
          aria-label={snapshot.status === "playing" ? "Pause demo" : "Play demo"}
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-raised text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {snapshot.status === "playing" ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={snapshot.totalFrames}
          value={snapshot.frame}
          onChange={(e) => player.seek(Number(e.target.value))}
          aria-label="Scrub the merge sort demo"
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-raised accent-[var(--primary)]"
        />
      </div>
    </div>
  );
}
