/**
 * Layer 1 — static analysis (TRD §5.1).
 *
 * Parses JS/TS with @babel/parser and walks the AST per function:
 *  - loop classification by update + bound (i++ over n → n; i*=2 / bisection → log n;
 *    bound depending on an outer loop var → triangular, still n),
 *  - known-call cost table (Array.sort → n log n, includes → n, Map.get → 1, …),
 *  - recursion → recurrence shape → Master-theorem lookup / summation / exponential.
 *
 * HONESTY RULE (hard requirement): anything unrecognized lands in `unresolved[]` and lowers
 * confidence. Conservative assumptions are labelled as assumptions — the analyzer never
 * silently guesses. Parsing only — this module never executes user code.
 */
import { parse } from "@babel/parser";
import type * as t from "@babel/types";
import { compare, EXP, LOG_N, max, mul, N, ONE, toLabel, type Cost } from "../classes";
import { GLOBAL_COSTS, METHOD_COSTS } from "./known-calls";

export type Confidence = "low" | "medium" | "high";

export interface Annotation {
  line: number;
  note: string;
}

export interface StaticResult {
  ok: true;
  bigO: string;
  confidence: Confidence;
  annotations: Annotation[];
  unresolved: string[];
  /** Name of the function that was analyzed (the entry function). */
  entryName: string;
}

export interface StaticParseError {
  ok: false;
  error: string;
  line?: number;
}

type FnNode = t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression;

interface Ctx {
  fnName: string | null;
  /** Parameter names + aliases of parameters / their .length — "size identifiers". */
  sizeIds: Set<string>;
  /** Variables that bisect a window (mid = (lo+hi)/2 style). */
  midIds: Set<string>;
  /** Loop variables of enclosing loops (for triangular-bound detection). */
  outerLoopVars: Set<string>;
  /** Costs of previously analyzed sibling functions (call resolution). */
  siblings: Map<string, Cost>;
  annotations: Annotation[];
  unresolved: string[];
}

const line = (n: t.Node): number => n.loc?.start.line ?? 1;

// --- entry --------------------------------------------------------------------------------------

export function analyzeStatic(source: string): StaticResult | StaticParseError {
  let ast: t.File;
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: ["typescript"],
      errorRecovery: false,
    });
  } catch (e) {
    const err = e as { message?: string; loc?: { line: number } };
    return { ok: false, error: err.message ?? "Parse error", line: err.loc?.line };
  }

  const fns = collectTopLevelFunctions(ast);
  if (fns.length === 0) {
    return { ok: false, error: "No function found — paste a complete function declaration." };
  }

  // Analyze in declaration order so later functions can resolve calls to earlier ones;
  // the LAST function is the entry (helpers-first convention, matching textbook style).
  const siblings = new Map<string, Cost>();
  let result: { cost: Cost; ctx: Ctx; name: string } | null = null;
  for (const { name, node } of fns) {
    const ctx: Ctx = {
      fnName: name,
      sizeIds: collectSizeIds(node),
      midIds: new Set(),
      outerLoopVars: new Set(),
      siblings,
      annotations: [],
      unresolved: [],
    };
    const cost = analyzeFunction(node, ctx);
    siblings.set(name, cost);
    result = { cost, ctx, name };
  }

  const { cost, ctx, name } = result!;
  const confidence: Confidence =
    ctx.unresolved.length === 0 ? "high" : ctx.unresolved.length === 1 ? "medium" : "low";

  return {
    ok: true,
    bigO: toLabel(cost),
    confidence,
    annotations: ctx.annotations.sort((a, b) => a.line - b.line),
    unresolved: ctx.unresolved,
    entryName: name,
  };
}

function collectTopLevelFunctions(ast: t.File): { name: string; node: FnNode }[] {
  const out: { name: string; node: FnNode }[] = [];
  for (const stmt of ast.program.body) {
    const s = stmt.type === "ExportNamedDeclaration" || stmt.type === "ExportDefaultDeclaration"
      ? (stmt.declaration ?? stmt)
      : stmt;
    if (s.type === "FunctionDeclaration" && s.id) {
      out.push({ name: s.id.name, node: s });
    } else if (s.type === "VariableDeclaration") {
      for (const d of s.declarations) {
        if (
          d.id.type === "Identifier" &&
          d.init &&
          (d.init.type === "ArrowFunctionExpression" || d.init.type === "FunctionExpression")
        ) {
          out.push({ name: d.id.name, node: d.init });
        }
      }
    }
  }
  return out;
}

/** Parameters and `const n = arr.length` style aliases count as the input size. */
function collectSizeIds(fn: FnNode): Set<string> {
  const ids = new Set<string>();
  for (const p of fn.params) {
    if (p.type === "Identifier") ids.add(p.name);
    if (p.type === "AssignmentPattern" && p.left.type === "Identifier") ids.add(p.left.name);
  }
  walk(fn.body, (node) => {
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier" && node.init) {
      if (isSizeExpression(node.init, ids)) ids.add(node.id.name);
    }
  });
  return ids;
}

/** expr references the input size: a size id, `x.length`, or arithmetic on either. */
function isSizeExpression(e: t.Node, sizeIds: Set<string>): boolean {
  if (e.type === "Identifier") return sizeIds.has(e.name);
  if (e.type === "MemberExpression" && !e.computed && e.property.type === "Identifier") {
    if (e.property.name === "length" || e.property.name === "size") return true;
  }
  if (e.type === "BinaryExpression") {
    return (
      isSizeExpression(e.left, sizeIds) || isSizeExpression(e.right, sizeIds)
    );
  }
  if (e.type === "CallExpression") {
    // Math.floor(n / 2) etc.
    return e.arguments.some((a) => isSizeExpression(a as t.Node, sizeIds));
  }
  return false;
}

// --- generic walker -------------------------------------------------------------------------------

function walk(node: t.Node | null | undefined, visit: (n: t.Node) => void): void {
  if (!node || typeof node.type !== "string") return;
  visit(node);
  const rec = node as unknown as Record<string, unknown>;
  for (const key of Object.keys(rec)) {
    if (key === "loc" || key === "leadingComments" || key === "trailingComments") continue;
    const value = rec[key];
    if (Array.isArray(value)) {
      for (const v of value) if (v && typeof (v as t.Node).type === "string") walk(v as t.Node, visit);
    } else if (value && typeof (value as t.Node).type === "string") {
      walk(value as t.Node, visit);
    }
  }
}

// --- function analysis ----------------------------------------------------------------------------

function analyzeFunction(fn: FnNode, ctx: Ctx): Cost {
  const body: t.Node = fn.body;

  // Pre-pass: find bisection mid variables anywhere in the function.
  walk(body, (node) => {
    if (
      (node.type === "VariableDeclarator" || node.type === "AssignmentExpression") &&
      isBisection(node.type === "VariableDeclarator" ? node.init : node.right)
    ) {
      const target = node.type === "VariableDeclarator" ? node.id : node.left;
      if (target.type === "Identifier") ctx.midIds.add(target.name);
    }
  });

  const selfCalls = ctx.fnName ? collectSelfCalls(body, ctx.fnName) : [];
  if (selfCalls.length > 0) {
    return analyzeRecursion(fn, body, selfCalls, ctx);
  }
  return costOfNode(body, ctx);
}

/**
 * A halving expression: `(lo + hi) / 2`, `arr.length / 2`, `n >> 1`, optionally wrapped in
 * Math.floor/Math.trunc. Anything-divided-by-two of a non-literal counts — the variable it is
 * assigned to becomes a "mid" (bisection) identifier.
 */
function isBisection(e: t.Node | null | undefined): boolean {
  if (!e) return false;
  if (e.type === "CallExpression") {
    // Math.floor(...), Math.trunc(...)
    return e.arguments.length > 0 && isBisection(e.arguments[0] as t.Node);
  }
  if (e.type === "BinaryExpression") {
    const halvesByDiv =
      e.operator === "/" && e.right.type === "NumericLiteral" && e.right.value === 2;
    const halvesByShift =
      e.operator === ">>" && e.right.type === "NumericLiteral" && e.right.value === 1;
    if (halvesByDiv || halvesByShift) {
      return e.left.type !== "NumericLiteral";
    }
  }
  return false;
}

// --- recursion ------------------------------------------------------------------------------------

interface SelfCall {
  node: t.CallExpression;
  shrink: "half" | "minus" | "unknown";
}

function collectSelfCalls(body: t.Node, fnName: string): SelfCall[] {
  const calls: SelfCall[] = [];
  walk(body, (node) => {
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === fnName
    ) {
      calls.push({ node, shrink: "unknown" });
    }
  });
  return calls;
}

/** Classify how a self-call shrinks the problem, from its argument shapes. */
function classifyShrink(call: t.CallExpression, ctx: Ctx): "half" | "minus" | "unknown" {
  let sawHalf = false;
  let sawMinus = false;
  for (const arg of call.arguments) {
    const a = arg as t.Node;
    // n / 2, n >> 1, Math.floor(n / 2)
    if (isHalfExpression(a, ctx)) sawHalf = true;
    // mid, mid ± 1 → bisected window
    if (referencesMid(a, ctx)) sawHalf = true;
    // arr.slice(0, mid) / arr.slice(mid)
    if (isSliceHalf(a, ctx)) sawHalf = true;
    // n - 1 / i + 1 (index toward bound)
    if (isStepExpression(a, ctx)) sawMinus = true;
  }
  if (sawHalf) return "half";
  if (sawMinus) return "minus";
  return "unknown";
}

function isHalfExpression(e: t.Node, ctx: Ctx): boolean {
  if (e.type === "CallExpression") {
    return e.arguments.length > 0 && isHalfExpression(e.arguments[0] as t.Node, ctx);
  }
  if (e.type === "BinaryExpression") {
    if (
      (e.operator === "/" || e.operator === ">>") &&
      e.right.type === "NumericLiteral" &&
      (e.right.value === 2 || (e.operator === ">>" && e.right.value === 1))
    ) {
      return isSizeExpression(e.left, ctx.sizeIds);
    }
  }
  return false;
}

function referencesMid(e: t.Node, ctx: Ctx): boolean {
  if (e.type === "Identifier") return ctx.midIds.has(e.name);
  if (e.type === "BinaryExpression" && (e.operator === "+" || e.operator === "-")) {
    return referencesMid(e.left, ctx) || referencesMid(e.right, ctx);
  }
  return false;
}

function isSliceHalf(e: t.Node, ctx: Ctx): boolean {
  if (
    e.type === "CallExpression" &&
    e.callee.type === "MemberExpression" &&
    !e.callee.computed &&
    e.callee.property.type === "Identifier" &&
    e.callee.property.name === "slice"
  ) {
    return e.arguments.some((a) => referencesMid(a as t.Node, ctx) || isHalfExpression(a as t.Node, ctx));
  }
  return false;
}

/** n − c or i + c: a step of constant size toward a bound. */
function isStepExpression(e: t.Node, ctx: Ctx): boolean {
  return (
    e.type === "BinaryExpression" &&
    (e.operator === "-" || e.operator === "+") &&
    e.left.type === "Identifier" &&
    ctx.sizeIds.has(e.left.name) &&
    e.right.type === "NumericLiteral"
  );
}

/** Does this statement unconditionally leave the function (return/throw, possibly in a block)? */
function terminates(stmt: t.Node): boolean {
  if (stmt.type === "ReturnStatement" || stmt.type === "ThrowStatement") return true;
  if (stmt.type === "BlockStatement") {
    const last = stmt.body.at(-1);
    return last ? terminates(last) : false;
  }
  return false;
}

/**
 * Max self-calls along any single execution path. If/else branches don't add up, and a
 * guard-style `if (x) return f(…);` splits the path against the REST of the sequence —
 * essential so recursive binary search (two call sites, one per path) reads as a = 1.
 */
function maxCallsPerPath(node: t.Node, fnName: string): number {
  switch (node.type) {
    case "BlockStatement":
      return maxCallsInSequence(node.body, fnName);
    case "IfStatement": {
      const test = maxCallsPerPath(node.test, fnName);
      const cons = maxCallsPerPath(node.consequent, fnName);
      const alt = node.alternate ? maxCallsPerPath(node.alternate, fnName) : 0;
      return test + Math.max(cons, alt);
    }
    case "ConditionalExpression": {
      const test = maxCallsPerPath(node.test, fnName);
      const cons = maxCallsPerPath(node.consequent, fnName);
      const alt = maxCallsPerPath(node.alternate, fnName);
      return test + Math.max(cons, alt);
    }
    case "SwitchStatement": {
      let best = 0;
      for (const c of node.cases) {
        best = Math.max(best, maxCallsInSequence(c.consequent, fnName));
      }
      return maxCallsPerPath(node.discriminant, fnName) + best;
    }
    case "CallExpression": {
      let sum =
        node.callee.type === "Identifier" && node.callee.name === fnName ? 1 : 0;
      sum += maxCallsPerPath(node.callee, fnName);
      for (const a of node.arguments) sum += maxCallsPerPath(a as t.Node, fnName);
      return sum;
    }
    default: {
      let sum = 0;
      const rec = node as unknown as Record<string, unknown>;
      for (const key of Object.keys(rec)) {
        if (key === "loc" || key === "leadingComments" || key === "trailingComments") continue;
        const value = rec[key];
        if (Array.isArray(value)) {
          for (const v of value) {
            if (v && typeof (v as t.Node).type === "string") sum += maxCallsPerPath(v as t.Node, fnName);
          }
        } else if (value && typeof (value as t.Node).type === "string") {
          sum += maxCallsPerPath(value as t.Node, fnName);
        }
      }
      return sum;
    }
  }
}

function maxCallsInSequence(stmts: t.Node[], fnName: string): number {
  if (stmts.length === 0) return 0;
  const [head, ...rest] = stmts;
  // Guard: `if (x) return f(…);` — the consequent and the remainder are alternative paths.
  if (head!.type === "IfStatement" && !head!.alternate && terminates(head!.consequent)) {
    const test = maxCallsPerPath(head!.test, fnName);
    const cons = maxCallsPerPath(head!.consequent, fnName);
    return test + Math.max(cons, maxCallsInSequence(rest, fnName));
  }
  return maxCallsPerPath(head!, fnName) + maxCallsInSequence(rest, fnName);
}

function analyzeRecursion(fn: FnNode, body: t.Node, selfCalls: SelfCall[], ctx: Ctx): Cost {
  for (const call of selfCalls) call.shrink = classifyShrink(call.node, ctx);

  const a = maxCallsPerPath(body, ctx.fnName!);
  const shrinks = new Set(selfCalls.map((c) => c.shrink));
  const firstLine = line(selfCalls[0]!.node);

  // Non-recursive work per invocation: cost of the body with self-calls counted as O(1).
  const f = costOfNode(body, { ...ctx, fnName: null, siblings: withSelf(ctx, ONE) });

  if (shrinks.has("unknown")) {
    ctx.unresolved.push(
      "recursion argument pattern not recognized — recurrence not classified (general-case " +
        "automatic analysis is undecidable; empirical measurement is the better witness here)",
    );
    ctx.annotations.push({ line: firstLine, note: "unrecognized recursion pattern" });
    return f; // best effort: at least the per-call work; confidence already lowered
  }

  if (shrinks.has("half") && !shrinks.has("minus")) {
    // T(n) = a·T(n/2) + f(n) → Master theorem with b = 2, c = log2(a).
    const c = Math.log2(Math.max(a, 1));
    const d = f.exp ? Infinity : f.deg;
    let result: Cost;
    if (f.exp) result = EXP;
    else if (d < c) result = { deg: c, log: 0, exp: false };
    else if (d === c) result = { deg: d, log: f.log + 1, exp: false };
    else result = f;
    ctx.annotations.push({
      line: firstLine,
      note: `T(n) = ${a}·T(n/2) + ${toLabel(f)} → ${toLabel(result)} (Master theorem)`,
    });
    return result;
  }

  // minus-pattern
  if (a === 1) {
    // T(n) = T(n−1) + f(n) → n · f(n) (summation).
    const result = mul(N, f);
    ctx.annotations.push({
      line: firstLine,
      note: `T(n) = T(n−1) + ${toLabel(f)} → ${toLabel(result)} (summation)`,
    });
    return result;
  }

  // ≥2 self-calls stepping by a constant → exponential.
  ctx.annotations.push({
    line: firstLine,
    note: `${a} self-calls on n−c per invocation → O(2ⁿ) (exponential branching)`,
  });
  return EXP;
}

function withSelf(ctx: Ctx, cost: Cost): Map<string, Cost> {
  const m = new Map(ctx.siblings);
  if (ctx.fnName) m.set(ctx.fnName, cost);
  return m;
}

// --- statement / expression costs -----------------------------------------------------------------

function costOfNode(node: t.Node | null | undefined, ctx: Ctx): Cost {
  if (!node) return ONE;
  switch (node.type) {
    case "BlockStatement": {
      let acc = ONE;
      for (const s of node.body) acc = max(acc, costOfNode(s, ctx));
      return acc;
    }
    case "ExpressionStatement":
      return costOfNode(node.expression, ctx);
    case "ReturnStatement":
    case "ThrowStatement":
      return costOfNode(node.argument, ctx);
    case "VariableDeclaration": {
      let acc = ONE;
      for (const d of node.declarations) acc = max(acc, costOfNode(d.init, ctx));
      return acc;
    }
    case "IfStatement":
      return max(
        costOfNode(node.test, ctx),
        max(costOfNode(node.consequent, ctx), costOfNode(node.alternate, ctx)),
      );
    case "ConditionalExpression":
      return max(
        costOfNode(node.test, ctx),
        max(costOfNode(node.consequent, ctx), costOfNode(node.alternate, ctx)),
      );
    case "SwitchStatement": {
      let acc = costOfNode(node.discriminant, ctx);
      for (const c of node.cases) for (const s of c.consequent) acc = max(acc, costOfNode(s, ctx));
      return acc;
    }
    case "ForStatement":
      return costOfForLoop(node, ctx);
    case "WhileStatement":
    case "DoWhileStatement":
      return costOfWhileLoop(node, ctx);
    case "ForOfStatement":
    case "ForInStatement":
      return costOfForEachLoop(node, ctx);
    case "CallExpression":
      return costOfCall(node, ctx);
    case "BinaryExpression":
    case "LogicalExpression":
      return max(costOfNode(node.left, ctx), costOfNode(node.right, ctx));
    case "AssignmentExpression":
      return max(costOfNode(node.left, ctx), costOfNode(node.right, ctx));
    case "UpdateExpression":
    case "UnaryExpression":
      return costOfNode(node.argument, ctx);
    case "MemberExpression":
      return max(costOfNode(node.object, ctx), node.computed ? costOfNode(node.property, ctx) : ONE);
    case "ArrayExpression": {
      let acc = ONE;
      for (const e of node.elements) acc = max(acc, costOfNode(e, ctx));
      return acc;
    }
    case "ObjectExpression": {
      let acc = ONE;
      for (const p of node.properties) {
        if (p.type === "ObjectProperty") acc = max(acc, costOfNode(p.value, ctx));
      }
      return acc;
    }
    case "TemplateLiteral": {
      let acc = ONE;
      for (const e of node.expressions) acc = max(acc, costOfNode(e, ctx));
      return acc;
    }
    case "SpreadElement":
      // Spreading a size-n iterable is an O(n) copy.
      return isSizeExpression(node.argument, ctx.sizeIds) ? N : costOfNode(node.argument, ctx);
    case "NewExpression": {
      let acc = ONE;
      for (const a of node.arguments) {
        const arg = a as t.Node;
        // new Set(arr) / new Map(pairs) copy their iterable argument.
        acc = max(acc, isSizeExpression(arg, ctx.sizeIds) ? N : costOfNode(arg, ctx));
      }
      return acc;
    }
    case "ArrowFunctionExpression":
    case "FunctionExpression":
    case "FunctionDeclaration":
      return ONE; // definition alone costs nothing; invocation is costed at the call site
    case "TryStatement":
      return max(
        costOfNode(node.block, ctx),
        max(costOfNode(node.handler?.body, ctx), costOfNode(node.finalizer, ctx)),
      );
    case "BreakStatement":
    case "ContinueStatement":
    case "Identifier":
    case "NumericLiteral":
    case "StringLiteral":
    case "BooleanLiteral":
    case "NullLiteral":
      return ONE;
    default:
      return ONE;
  }
}

// --- loops ----------------------------------------------------------------------------------------

function costOfForLoop(node: t.ForStatement, ctx: Ctx): Cost {
  const loopVar = forLoopVar(node);
  const iter = classifyForIterations(node, ctx);

  const inner: Ctx = loopVar
    ? { ...ctx, outerLoopVars: new Set([...ctx.outerLoopVars, loopVar]) }
    : ctx;
  const bodyCost = costOfNode(node.body, inner);
  const cost = mul(iter.cost, bodyCost);

  ctx.annotations.push({ line: line(node), note: iter.note });
  if (iter.unresolved) ctx.unresolved.push(iter.unresolved);
  return cost;
}

function forLoopVar(node: t.ForStatement): string | null {
  if (node.init?.type === "VariableDeclaration") {
    const d = node.init.declarations[0];
    if (d?.id.type === "Identifier") return d.id.name;
  }
  if (node.init?.type === "AssignmentExpression" && node.init.left.type === "Identifier") {
    return node.init.left.name;
  }
  return null;
}

interface IterClass {
  cost: Cost;
  note: string;
  unresolved?: string;
}

function classifyForIterations(node: t.ForStatement, ctx: Ctx): IterClass {
  const update = node.update;
  const ln = line(node);

  // Geometric update → logarithmic.
  if (update?.type === "AssignmentExpression") {
    if (update.operator === "*=" || update.operator === "/=" || update.operator === ">>=") {
      return { cost: LOG_N, note: "geometric loop (×/÷ per step) → log n" };
    }
  }

  // Arithmetic update (i++, i--, i += c) → bound decides.
  const test = node.test;
  if (test?.type === "BinaryExpression") {
    const bound = boundExpression(test, ctx);
    if (bound === "size") return { cost: N, note: "loop to n → n iterations" };
    if (bound === "outer")
      return { cost: N, note: "bound depends on outer loop variable → triangular, still O(n) here" };
    if (bound === "constant") return { cost: ONE, note: "constant-bound loop → O(1)" };
  }

  return {
    cost: N,
    note: `loop bound not recognized — assumed n (line ${ln})`,
    unresolved: `loop bound at line ${ln} not recognized (assumed n iterations)`,
  };
}

function boundExpression(test: t.BinaryExpression, ctx: Ctx): "size" | "outer" | "constant" | "unknown" {
  for (const side of [test.right, test.left]) {
    const s = side as t.Node;
    if (isSizeExpression(s, ctx.sizeIds)) return "size";
    if (s.type === "Identifier" && ctx.outerLoopVars.has(s.name)) return "outer";
  }
  if (test.right.type === "NumericLiteral" || test.left.type === "NumericLiteral") return "constant";
  return "unknown";
}

function costOfWhileLoop(node: t.WhileStatement | t.DoWhileStatement, ctx: Ctx): Cost {
  const ln = line(node);
  const bodyCost = costOfNode(node.body, ctx);

  // Bisection loop: body computes a mid from (lo+hi)/2 and reassigns the window.
  let bisects = false;
  walk(node.body, (n) => {
    if (
      (n.type === "VariableDeclarator" && isBisection(n.init)) ||
      (n.type === "AssignmentExpression" && isBisection(n.right))
    ) {
      bisects = true;
    }
  });
  if (bisects) {
    ctx.annotations.push({ line: ln, note: "window bisection per iteration → log n" });
    return mul(LOG_N, bodyCost);
  }

  // Halving of a tracked variable: x = x / 2, x >>= 1, x = Math.floor(x / 2).
  // Track WHICH variables step, so the test must actually compare a stepped variable —
  // otherwise Collatz-style loops would masquerade as counters (honesty rule).
  let halves = false;
  const stepped = new Set<string>();
  walk(node.body, (n) => {
    if (n.type === "AssignmentExpression") {
      if (n.operator === "/=" || n.operator === "*=" || n.operator === ">>=") halves = true;
      if ((n.operator === "+=" || n.operator === "-=") && n.left.type === "Identifier") {
        stepped.add(n.left.name);
      }
      if (n.operator === "=" && n.left.type === "Identifier") {
        if (isPureHalvingOf(n.right, n.left.name)) halves = true;
      }
    }
    if (n.type === "UpdateExpression" && n.argument.type === "Identifier") {
      stepped.add(n.argument.name);
    }
  });
  if (halves) {
    ctx.annotations.push({ line: ln, note: "halving/doubling per iteration → log n" });
    return mul(LOG_N, bodyCost);
  }
  if (stepped.size > 0 && node.test.type === "BinaryExpression") {
    const { left, right } = node.test;
    const steppedSide =
      left.type === "Identifier" && stepped.has(left.name)
        ? (right as t.Node)
        : right.type === "Identifier" && stepped.has(right.name)
          ? (left as t.Node)
          : null;
    if (
      steppedSide &&
      (isSizeExpression(steppedSide, ctx.sizeIds) ||
        (steppedSide.type === "Identifier" && ctx.outerLoopVars.has(steppedSide.name)))
    ) {
      ctx.annotations.push({ line: ln, note: "while with counter to n → n iterations" });
      return mul(N, bodyCost);
    }
  }

  // Data-dependent exit → honesty rule.
  ctx.annotations.push({ line: ln, note: "while-loop exit is data-dependent — assumed n" });
  ctx.unresolved.push(
    `while-loop at line ${ln} has a data-dependent exit condition (assumed n iterations)`,
  );
  return mul(N, bodyCost);
}

/**
 * The RHS must BE a halving of `name` (optionally Math.floor/trunc-wrapped) — not merely
 * contain one. `n = n / 2` halves; Collatz's `n = n % 2 === 0 ? n / 2 : 3 * n + 1` does not
 * (the loop is data-dependent and must stay unresolved — honesty rule).
 */
function isPureHalvingOf(e: t.Node, name: string): boolean {
  if (e.type === "CallExpression") {
    if (
      e.callee.type === "MemberExpression" &&
      e.callee.object.type === "Identifier" &&
      e.callee.object.name === "Math" &&
      e.arguments.length > 0
    ) {
      return isPureHalvingOf(e.arguments[0] as t.Node, name);
    }
    return false;
  }
  return (
    e.type === "BinaryExpression" &&
    ((e.operator === "/" && e.right.type === "NumericLiteral" && e.right.value === 2) ||
      (e.operator === ">>" && e.right.type === "NumericLiteral" && e.right.value === 1)) &&
    e.left.type === "Identifier" &&
    e.left.name === name
  );
}

function costOfForEachLoop(node: t.ForOfStatement | t.ForInStatement, ctx: Ctx): Cost {
  const bodyCost = costOfNode(node.body, ctx);
  ctx.annotations.push({ line: line(node), note: "iterates the collection → n" });
  return mul(N, bodyCost);
}

// --- calls ----------------------------------------------------------------------------------------

function costOfCall(node: t.CallExpression, ctx: Ctx): Cost {
  // Arguments are evaluated regardless of what the call costs.
  let argCost = ONE;
  for (const a of node.arguments) {
    const arg = a as t.Node;
    if (arg.type === "ArrowFunctionExpression" || arg.type === "FunctionExpression") continue;
    argCost = max(argCost, costOfNode(arg, ctx));
  }

  const callee = node.callee;

  // obj.method(...)
  if (callee.type === "MemberExpression" && !callee.computed && callee.property.type === "Identifier") {
    const method = callee.property.name;
    const objCost = costOfNode(callee.object, ctx);

    // Math.* and other namespaced globals
    if (callee.object.type === "Identifier") {
      const qualified = `${callee.object.name}.${method}`;
      if (callee.object.name === "Math") return max(argCost, objCost);
      const known = GLOBAL_COSTS[qualified];
      if (known) {
        if (compare(known.cost, ONE) > 0) {
          ctx.annotations.push({ line: line(node), note: known.note });
        }
        return max(max(known.cost, argCost), objCost);
      }
    }

    const entry = METHOD_COSTS[method];
    if (entry) {
      let cost = entry.cost;
      if (entry.cbMultiplier) {
        const cb = node.arguments.find(
          (a) => a.type === "ArrowFunctionExpression" || a.type === "FunctionExpression",
        ) as t.ArrowFunctionExpression | t.FunctionExpression | undefined;
        if (cb) cost = mul(entry.cbMultiplier, costOfNode(cb.body, ctx));
      }
      if (compare(cost, ONE) > 0) ctx.annotations.push({ line: line(node), note: entry.note });
      return max(max(cost, argCost), objCost);
    }

    // Unknown method on an object — honesty rule.
    ctx.unresolved.push(
      `unknown call cost: .${method}() at line ${line(node)} (assumed O(1))`,
    );
    return max(argCost, objCost);
  }

  // bareCall(...)
  if (callee.type === "Identifier") {
    const sibling = ctx.siblings.get(callee.name);
    if (sibling) {
      if (compare(sibling, ONE) > 0) {
        ctx.annotations.push({
          line: line(node),
          note: `call ${callee.name}() → ${toLabel(sibling)}`,
        });
      }
      return max(sibling, argCost);
    }
    const known = GLOBAL_COSTS[callee.name];
    if (known) return max(known.cost, argCost);
    ctx.unresolved.push(
      `unknown call cost: ${callee.name}() at line ${line(node)} (assumed O(1))`,
    );
    return argCost;
  }

  return argCost;
}
