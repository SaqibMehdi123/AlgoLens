/**
 * Step emitter helpers. Generators import these so the call sites read like the algorithm
 * (`yield cmp(j, j + 1, 3)`), mirroring the TRD §4.1 example exactly.
 */
import type { CallFrame, HighlightRole, Json, Ref, Step } from "./step";

export const cmp = (a: Ref, b: Ref, line: number): Step => ({ t: "compare", a, b, line });

export const swap = (a: Ref, b: Ref, line: number): Step => ({ t: "swap", a, b, line });

export const setVal = (ref: Ref, value: Json, line: number): Step => ({ t: "set", ref, value, line });

export const vars = (values: Record<string, Json>, line: number): Step => ({
  t: "vars",
  values,
  line,
});

export const markSorted = (refs: Ref[], line: number): Step => ({ t: "markSorted", refs, line });

export const highlight = (refs: Ref[], line: number, role?: HighlightRole): Step => ({
  t: "highlight",
  refs,
  ...(role ? { role } : {}),
  line,
});

export const unhighlight = (refs: Ref[], line: number): Step => ({ t: "unhighlight", refs, line });

export const visit = (ref: Ref, line: number): Step => ({ t: "visit", ref, line });

export const enqueue = (ref: Ref, line: number): Step => ({ t: "enqueue", ref, line });

export const dequeue = (ref: Ref, line: number): Step => ({ t: "dequeue", ref, line });

export const push = (ref: Ref, line: number): Step => ({ t: "push", ref, line });

export const pop = (ref: Ref, line: number): Step => ({ t: "pop", ref, line });

export const annotate = (text: string, line: number): Step => ({ t: "annotate", text, line });

export const callPush = (frame: CallFrame, line: number): Step => ({ t: "callPush", frame, line });

export const callPop = (frame: CallFrame, line: number): Step => ({ t: "callPop", frame, line });
