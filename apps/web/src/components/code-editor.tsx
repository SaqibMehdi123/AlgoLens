"use client";

import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";

export type EditorLanguage = "javascript" | "typescript" | "python" | "cpp" | "java";

function languageExtension(language: EditorLanguage) {
  switch (language) {
    case "javascript":
      return [javascript({ jsx: false })];
    case "typescript":
      return [javascript({ typescript: true, jsx: false })];
    case "python":
      return [python()];
    case "cpp":
      return [cpp()];
    case "java":
      return [java()];
  }
}

export interface CodeEditorProps {
  value: string;
  language: EditorLanguage;
  onChange: (value: string) => void;
  height?: string;
  ariaLabel?: string;
}

/**
 * CodeMirror 6 editor — syntax highlighting per language, line numbers, bracket matching. Pure
 * bundled JS (no CDN, no web workers, no eval), so it stays within the strict CSP from Phase 6.
 * Loaded lazily (see CodeEditorLazy) to keep it out of the initial route bundle (TRD §9).
 */
export default function CodeEditor({
  value,
  language,
  onChange,
  height = "420px",
  ariaLabel = "Code editor",
}: CodeEditorProps) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-subtle focus-within:ring-2 focus-within:ring-ring"
      aria-label={ariaLabel}
    >
      <CodeMirror
        value={value}
        height={height}
        theme={oneDark}
        extensions={languageExtension(language)}
        onChange={onChange}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
      />
    </div>
  );
}
