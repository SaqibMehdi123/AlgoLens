import { ComplexityLab } from "@/components/analyze/lab";

export const metadata = {
  title: "Complexity Lab",
  description:
    "Paste a function and get an honest Big-O estimate: static AST analysis plus empirical curve-fitting, each with its confidence.",
};

export default function AnalyzePage() {
  return (
    <div className="mx-auto w-full max-w-[1180px] py-9">
      <div className="mb-2 font-mono text-xs uppercase tracking-[0.15em] text-primary">
        // complexity lab
      </div>
      <h1 className="text-[32px] font-bold tracking-[-0.02em] text-foreground">Complexity Lab</h1>
      <p className="mt-2 max-w-[70ch] text-base text-secondary">
        Two independent witnesses analyze your function: a static AST pass that reasons about
        structure, and an empirical pass that measures real growth. When they agree, you get a
        confident verdict. When they disagree, you see both — never a single overconfident oracle.
      </p>
      <div className="mt-7">
        <ComplexityLab />
      </div>
    </div>
  );
}
