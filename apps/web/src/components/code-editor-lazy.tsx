"use client";

import dynamic from "next/dynamic";
import type { CodeEditorProps } from "./code-editor";

/** Lazy CodeMirror — separate chunk, client-only, so it never weighs down the initial route JS. */
const CodeEditor = dynamic(() => import("./code-editor"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-[420px] place-items-center rounded-xl border border-subtle bg-surface font-mono text-sm text-muted">
      loading editor…
    </div>
  ),
});

export function CodeEditorLazy(props: CodeEditorProps) {
  return <CodeEditor {...props} />;
}
