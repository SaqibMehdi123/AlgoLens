# ADR 0002 — Step vocabulary extensions

**Status:** Accepted · **Date:** 2026-06-10

## Context

TRD §4.1 fixes a `Step` union for array algorithms. Phase 1 step 4 requires proving the engine on
three structurally different layouts (array, tree, graph) and explicitly invites: *"If the Step
vocabulary needs changes, propose them BEFORE implementing."* Trees and graphs need a little more.

## Decision

Additive, backward-compatible extensions only — no documented step shape changed:

1. **`highlight` carries an optional `role`** (`active | pivot | frontier | range | path | special`),
   mapped to the fixed semantic palette (docs/05 §2). This lets one step type express the quicksort
   pivot (pink), the binary-search window (slate range) + cursor (cyan), and BFS frontiers (cyan).
2. **`highlight` uses replace-per-role semantics** in the reducer: `highlight(refs, role)` sets the
   role's highlighted set to exactly `refs`. This makes shrinking windows (binary search) and moving
   cursors (selection-sort min) trivial and keeps traces small. `unhighlight(refs)` removes refs from
   all roles; `markSorted`/`visit` remain permanent; `enqueue`/`dequeue` add/remove from the frontier.
3. **`TraceView` gains `tree` and `graph` shapes** alongside `array`, declaring the initial structure
   (tree nodes with parent/side; graph nodes with preset coordinates + edges). The player still derives
   each frame by folding steps `0..i` over this view, so backward stepping stays exact for all layouts.
4. **`set` reveals tree nodes**: in `bst-insert` the view declares all nodes `present:false`; a
   `set(nodeId, value)` step flips a node to present, so the tree grows as it is built.

## Consequences

- The TRD §4.1 array contract is unchanged; array algorithms read exactly as the doc's example.
- Three layouts run on one engine and one player/reducer, satisfying the Phase 1 risk gate.
- Renderers stay pure functions of the derived state; no new imperative animation paths were added.
