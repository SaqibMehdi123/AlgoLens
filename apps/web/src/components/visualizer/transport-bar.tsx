"use client";

import type { Player, PlayerSnapshot } from "@algolens/viz-engine";
import { Button } from "@algolens/ui";
import { Pause, Play, RotateCcw, Share2, SkipBack, SkipForward } from "lucide-react";

const SPEEDS = [0.25, 0.5, 1, 2, 4];

export interface TransportBarProps {
  player: Player;
  snapshot: PlayerSnapshot;
  onShare: () => void;
  shared: boolean;
}

export function TransportBar({ player, snapshot, onShare, shared }: TransportBarProps) {
  const { status, frame, totalFrames, speed } = snapshot;
  const playing = status === "playing";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-subtle bg-surface px-3 py-2">
      <Button
        size="icon"
        onClick={() => player.toggle()}
        aria-label={playing ? "Pause" : "Play"}
        aria-keyshortcuts="Space"
      >
        {playing ? <Pause /> : <Play />}
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={() => player.stepBack()}
        aria-label="Step back"
        aria-keyshortcuts="ArrowLeft"
        disabled={frame === 0}
      >
        <SkipBack />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={() => player.stepForward()}
        aria-label="Step forward"
        aria-keyshortcuts="ArrowRight"
        disabled={frame >= totalFrames}
      >
        <SkipForward />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => player.reset()} aria-label="Reset to start">
        <RotateCcw />
      </Button>

      <input
        type="range"
        min={0}
        max={totalFrames}
        value={frame}
        step={1}
        onChange={(e) => player.seek(Number(e.target.value))}
        aria-label="Scrub steps"
        aria-valuetext={`Step ${frame} of ${totalFrames}`}
        className="h-1.5 min-w-[120px] flex-1 cursor-pointer appearance-none rounded-full bg-raised accent-[var(--primary)]"
      />

      <span className="min-w-[68px] text-center font-mono text-xs tabular-nums text-secondary">
        {frame} / {totalFrames}
      </span>

      <label className="flex items-center gap-1.5 text-xs text-secondary">
        <span className="sr-only sm:not-sr-only">Speed</span>
        <select
          value={speed}
          onChange={(e) => player.setSpeed(Number(e.target.value))}
          aria-label="Playback speed"
          className="rounded-lg border border-subtle bg-raised px-2 py-1 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>

      <Button size="sm" variant="outline" onClick={onShare} aria-label="Copy shareable link">
        <Share2 />
        {shared ? "Copied!" : "Share"}
      </Button>
    </div>
  );
}
