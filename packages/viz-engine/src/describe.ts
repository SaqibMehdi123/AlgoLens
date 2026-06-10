/**
 * Human-readable step narration. Feeds the `aria-live` caption (accessibility rule 8) and the
 * reduced-motion mode (docs/05 §3), where discrete snapshots replace tweens and a textual caption
 * ("swapped a[3] and a[4]") describes each transition.
 */
import type { Ref, Step } from "@algolens/algo-core";

const ref = (r: Ref): string => (typeof r === "number" ? `index ${r}` : `node ${r}`);

export function describeStep(step: Step): string {
  switch (step.t) {
    case "compare":
      return `comparing ${ref(step.a)} and ${ref(step.b)}`;
    case "swap":
      return `swapped ${ref(step.a)} and ${ref(step.b)}`;
    case "set":
      return `wrote ${JSON.stringify(step.value)} to ${ref(step.ref)}`;
    case "visit":
      return `visited ${ref(step.ref)}`;
    case "enqueue":
      return `enqueued ${ref(step.ref)}`;
    case "dequeue":
      return `dequeued ${ref(step.ref)}`;
    case "push":
      return `pushed ${ref(step.ref)}`;
    case "pop":
      return `popped ${ref(step.ref)}`;
    case "markSorted":
      return `${step.refs.map(ref).join(", ")} in final position`;
    case "highlight":
      return step.refs.length ? `focus ${step.refs.map(ref).join(", ")}` : "cleared focus";
    case "unhighlight":
      return `cleared focus on ${step.refs.map(ref).join(", ")}`;
    case "callPush":
      return `call ${step.frame.fn}(${JSON.stringify(step.frame.args)})`;
    case "callPop":
      return `return from ${step.frame.fn}`;
    case "annotate":
      return step.text;
    case "vars":
      return Object.entries(step.values)
        .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
        .join(", ");
  }
}
