// Compile every lesson MDX through the same pipeline the lesson page uses (@mdx-js/mdx evaluate,
// production JSX runtime, remark-gfm). Catches syntax/JSX errors the text-based content tests miss.
// Usage: node apps/web/scripts/check-mdx.mjs [file.mdx ...]   (no args = all lessons)
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluate } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";

const here = dirname(fileURLToPath(import.meta.url));
const lessonsDir = resolve(here, "../../../content/lessons");
const args = process.argv.slice(2);
const files = args.length ? args : readdirSync(lessonsDir).filter((f) => f.endsWith(".mdx"));

let failed = 0;
for (const f of files) {
  const src = readFileSync(resolve(lessonsDir, f), "utf8");
  try {
    await evaluate(src, { ...jsxRuntime, development: false, remarkPlugins: [remarkGfm] });
    console.log("ok    " + f);
  } catch (e) {
    failed++;
    console.error("FAIL  " + f + " :: " + (e && e.message ? e.message : e));
  }
}
console.log(failed ? `\n${failed} file(s) failed to compile` : `\nAll ${files.length} MDX files compiled.`);
process.exit(failed ? 1 : 0);
