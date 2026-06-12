/**
 * Multi-language starter-code generator (LeetCode "implement this function" style). Each problem
 * declares a type-DSL signature (functionName + params + returnType); idiomatic stubs for all five
 * languages are generated from it, so adding a problem never means hand-writing five stubs.
 *
 * Type DSL: scalars `int | long | double | boolean | string | char`; append `[]` per array
 * dimension, e.g. `int[]`, `int[][]`, `string[]`.
 */
export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export type Language = "javascript" | "typescript" | "python" | "cpp" | "java";

export interface Param {
  name: string;
  type: string;
}

export const LANGUAGES: { id: Language; label: string; mono: string }[] = [
  { id: "javascript", label: "JavaScript", mono: "js" },
  { id: "typescript", label: "TypeScript", mono: "ts" },
  { id: "python", label: "Python", mono: "py" },
  { id: "cpp", label: "C++", mono: "cpp" },
  { id: "java", label: "Java", mono: "java" },
];

function dims(type: string): { base: string; depth: number } {
  let depth = 0;
  let base = type;
  while (base.endsWith("[]")) {
    base = base.slice(0, -2);
    depth += 1;
  }
  return { base, depth };
}

function tsType(type: string): string {
  const { base, depth } = dims(type);
  const scalar = base === "boolean" ? "boolean" : base === "string" || base === "char" ? "string" : "number";
  return scalar + "[]".repeat(depth);
}

function pyType(type: string): string {
  const { base, depth } = dims(type);
  const scalar =
    base === "boolean" ? "bool" : base === "string" || base === "char" ? "str" : base === "double" ? "float" : "int";
  let t = scalar;
  for (let i = 0; i < depth; i++) t = `List[${t}]`;
  return t;
}

function cppType(type: string, isParam: boolean): string {
  const { base, depth } = dims(type);
  const scalar =
    base === "long" ? "long long" : base === "boolean" ? "bool" : base === "string" ? "string" : base === "char" ? "char" : base;
  let t = scalar;
  for (let i = 0; i < depth; i++) t = `vector<${t}>`;
  const ref = isParam && (depth > 0 || base === "string");
  return ref ? `${t}&` : t;
}

function javaType(type: string): string {
  const { base, depth } = dims(type);
  const scalar = base === "string" ? "String" : base;
  return scalar + "[]".repeat(depth);
}

export function generateStarter(
  language: Language,
  fnName: string,
  params: Param[],
  returnType: string,
): string {
  const names = params.map((p) => p.name);
  switch (language) {
    case "javascript": {
      const doc = [
        ...params.map((p) => ` * @param {${tsType(p.type)}} ${p.name}`),
        ` * @return {${tsType(returnType)}}`,
      ].join("\n");
      return `/**\n${doc}\n */\nvar ${fnName} = function(${names.join(", ")}) {\n    \n};`;
    }
    case "typescript": {
      const sig = params.map((p) => `${p.name}: ${tsType(p.type)}`).join(", ");
      return `function ${fnName}(${sig}): ${tsType(returnType)} {\n    \n};`;
    }
    case "python": {
      const sig = params.map((p) => `${p.name}: ${pyType(p.type)}`).join(", ");
      return `class Solution:\n    def ${fnName}(self${sig ? ", " + sig : ""}) -> ${pyType(returnType)}:\n        `;
    }
    case "cpp": {
      const sig = params.map((p) => `${cppType(p.type, true)} ${p.name}`).join(", ");
      return `class Solution {\npublic:\n    ${cppType(returnType, false)} ${fnName}(${sig}) {\n        \n    }\n};`;
    }
    case "java": {
      const sig = params.map((p) => `${javaType(p.type)} ${p.name}`).join(", ");
      return `class Solution {\n    public ${javaType(returnType)} ${fnName}(${sig}) {\n        \n    }\n}`;
    }
  }
}

/** Human-readable signature for the statement header, e.g. `twoSum(nums: int[], target: int) -> int[]`. */
export function signatureString(fnName: string, params: Param[], returnType: string): string {
  return `${fnName}(${params.map((p) => `${p.name}: ${p.type}`).join(", ")}) -> ${returnType}`;
}
