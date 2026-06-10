import { ComplexityLab } from "@/components/analyze/lab";

export const metadata = {
  title: "Complexity Lab",
  description:
    "Paste a function and get an honest Big-O estimate: static AST analysis plus empirical curve-fitting, each with its confidence.",
};

export default function AnalyzePage() {
  return (
    <div className="py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Complexity Lab</h1>
        <p className="mt-2 max-w-[70ch] text-secondary">
          Two independent witnesses analyze your function: a static AST pass that reasons about
          structure, and an empirical pass that measures real growth. When they agree, you get a
          confident verdict. When they disagree, you see both — never a single overconfident
          oracle.
        </p>
      </header>
      <ComplexityLab />
    </div>
  );
}
