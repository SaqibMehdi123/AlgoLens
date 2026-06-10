/** React bindings for the framework-agnostic {@link Player} via useSyncExternalStore. */
import { useSyncExternalStore } from "react";
import type { Player, PlayerSnapshot } from "./state/player";

export function usePlayerSnapshot(player: Player): PlayerSnapshot {
  return useSyncExternalStore(player.subscribe, player.getSnapshot, player.getSnapshot);
}
