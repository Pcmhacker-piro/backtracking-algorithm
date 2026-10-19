import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { PROBLEMS, run, type Params, type ProblemId } from "@/lib/bt/algorithms";
import { ProblemView } from "@/components/bt/Views";
import { RecursionTree } from "@/components/bt/RecursionTree";
import { CodePanel } from "@/components/bt/CodePanel";
import { LearningPanel } from "@/components/bt/LearningPanel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Backtracking Visualizer — Permutations & Subset Sum" },
      { name: "description", content: "Step through backtracking for permutations and subset sum with synced code, call-stack metrics and state-space tree." },
      { property: "og:title", content: "Backtracking Visualizer — Permutations & Subset Sum" },
      { property: "og:description", content: "Step through real backtracking execution with synced code, explanations and recursion tree." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const DEFAULTS: Params = { n: 3, nums: [3, 34, 4, 12, 5, 2], target: 9, findAll: false };

function Index() {
  const [problem, setProblem] = useState<ProblemId>("perm");
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [numsText, setNumsText] = useState(DEFAULTS.nums.join(", "));
  const [config, setConfig] = useState<{ id: ProblemId; p: Params }>({ id: "perm", p: DEFAULTS });
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [mode, setMode] = useState<"code" | "learn">("code");

  const recording = useMemo(() => run(config.id, config.p), [config]);
  const total = recording.steps.length;
  const step = recording.steps[Math.min(i, total - 1)]!;

  useEffect(() => {
    if (!playing) return;
    if (i >= total - 1) { setPlaying(false); return; }
    const ms = Math.round(1000 / Math.pow(1.6, speed - 1));
    const t = setTimeout(() => setI((x) => x + 1), ms);
    return () => clearTimeout(t);
  }, [playing, i, total, speed]);

  const start = () => {
    let p = params;
    if (problem === "subset") {
      const nums = numsText.split(/[\s,]+/).map(Number).filter((x) => Number.isFinite(x) && x > 0).slice(0, 8);
      p = { ...params, nums: nums.length ? nums : DEFAULTS.nums, target: Math.max(1, params.target || 1) };
      setNumsText(p.nums.join(", "));
      setParams(p);
    }
    setConfig({ id: problem, p });
    setI(0);
    setPlaying(true);
  };

  const sizeRange = [1, 5];
  const showSize = problem === "perm";
  const canFindAll = problem === "subset";
  const solved = step.line === 2;

  return (
    <div className="min-h-screen px-3 py-4 sm:px-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10 font-mono text-sm font-semibold text-primary">BT</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Backtracking Visualizer</h1>
            <p className="text-xs text-muted-foreground">Permutations & Subset Sum · execution trace, call stack and state-space tree</p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="rounded border border-border px-2 py-1">{PROBLEMS.find((p) => p.id === config.id)?.name}</span>
          <span className="rounded border border-border px-2 py-1">{total} steps{recording.truncated && " · capped"}</span>
          <span className="rounded border border-border px-2 py-1">{config.id === "perm" ? "O(n · n!)" : "O(2ⁿ)"}</span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        {/* Left */}
        <aside className="panel h-fit space-y-4 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Algorithm</h2>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
            {PROBLEMS.map((p) => (
              <button key={p.id} onClick={() => setProblem(p.id)}
                className={cn("rounded-md border px-3 py-2 text-left transition-colors", problem === p.id ? "border-primary bg-primary/10" : "border-border hover:bg-accent")}>
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.blurb}</div>
              </button>
            ))}
          </div>

          <div className="space-y-3 border-t border-border pt-4 text-sm">
            {showSize && (
              <label className="block">
                <div className="mb-1 flex justify-between"><span>n (elements)</span><span className="font-mono text-primary">{Math.min(sizeRange[1], Math.max(sizeRange[0], params.n))}</span></div>
                <input type="range" min={sizeRange[0]} max={sizeRange[1]} value={Math.min(sizeRange[1], Math.max(sizeRange[0], params.n))}
                  onChange={(e) => setParams({ ...params, n: +e.target.value })} className="w-full accent-primary" />
              </label>
            )}
            {problem === "subset" && (
              <>
                <label className="block"><span className="mb-1 block">Numbers (positive, max 8)</span>
                  <input value={numsText} onChange={(e) => setNumsText(e.target.value)} className="w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono" /></label>
                <label className="block"><span className="mb-1 block">Target</span>
                  <input type="number" min={1} value={params.target} onChange={(e) => setParams({ ...params, target: +e.target.value })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono" /></label>
              </>
            )}
            {canFindAll && (
              <label className="flex items-center gap-2"><input type="checkbox" checked={params.findAll} onChange={(e) => setParams({ ...params, findAll: e.target.checked })} className="accent-primary" />Enumerate all solutions</label>
            )}
          </div>
          <button onClick={start} className="w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]">
            Run Algorithm
          </button>
        </aside>

        {/* Center */}
        <main className="min-w-0 space-y-4">
          <div className="panel flex min-h-[360px] flex-col items-center justify-center gap-4 p-4 sm:p-6">
            <ProblemView id={config.id} step={step} />
            <div className={cn("w-full max-w-xl rounded-md border px-4 py-2 text-center text-sm transition-colors",
              solved ? "border-success/50 bg-success/10 text-success" : step.valid === false ? "border-destructive/50 bg-destructive/10 text-destructive" : step.line === 9 || step.line === 12 ? "border-warning/50 bg-warning/10 text-warning" : "border-border bg-background/40")}>
              {step.msg}
            </div>
          </div>

          <div className="panel flex flex-wrap items-center gap-2 p-3">
            <Ctl onClick={() => { setPlaying(false); setI(0); }} label="Reset"><RotateCcw className="h-4 w-4" /></Ctl>
            <Ctl onClick={() => { setPlaying(false); setI((x) => Math.max(0, x - 1)); }} label="Previous step"><ChevronLeft className="h-4 w-4" /></Ctl>
            <button onClick={() => { if (i >= total - 1) setI(0); setPlaying(!playing); }} aria-label={playing ? "Pause" : "Play"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <Ctl onClick={() => { setPlaying(false); setI((x) => Math.min(total - 1, x + 1)); }} label="Next step"><ChevronRight className="h-4 w-4" /></Ctl>
            <input type="range" min={0} max={total - 1} value={i} onChange={(e) => { setPlaying(false); setI(+e.target.value); }} className="min-w-24 flex-1 accent-primary" aria-label="Timeline" />
            <span className="font-mono text-xs text-muted-foreground">{i + 1}/{total}</span>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">Speed
              <input type="range" min={1} max={10} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-20 accent-primary" />
            </label>
          </div>

          <div className="panel p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State-space tree</h2>
              <div className="flex gap-3 text-[11px] text-muted-foreground">
                <Legend cls="bg-primary" t="active" /><Legend cls="bg-primary/30" t="path" /><Legend cls="bg-muted" t="returned" /><Legend cls="bg-destructive/40" t="pruned" /><Legend cls="bg-success/50" t="solution" />
              </div>
            </div>
            <RecursionTree nodes={recording.nodes} at={i} active={step.node} onPick={(n) => { setPlaying(false); setI(Math.min(total - 1, n.createdAt)); }} />
            <p className="mt-1 text-[11px] text-muted-foreground">Click any node to jump to the moment it was created.</p>
          </div>
        </main>

        {/* Right */}
        <aside className="space-y-4">
          <div className="panel grid grid-cols-3 gap-px overflow-hidden p-0">
            <Stat k="Step" v={i + 1} /><Stat k="Depth" v={step.depth} /><Stat k="Calls" v={step.calls} />
            <Stat k="Backtracks" v={step.backs} /><Stat k="Solutions" v={step.solutions} />
            <Stat k="Valid?" v={step.valid === null ? "—" : step.valid ? "yes" : "no"} tone={step.valid === null ? "" : step.valid ? "text-success" : "text-destructive"} />
          </div>
          <div className="panel p-3 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Current decision</div>
            <div className="font-mono text-primary">{step.decision || "—"}</div>
            <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">State</div>
            <div className="break-all font-mono text-xs text-foreground/90">{describe(config.id, step.state)}</div>
          </div>
          <div className="panel p-3">
            <div className="mb-3 flex rounded-md bg-background/60 p-1 text-sm">
              {(["code", "learn"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={cn("flex-1 rounded px-3 py-1.5 transition-colors", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                  {m === "code" ? "Code Mode" : "Learning Mode"}
                </button>
              ))}
            </div>
            {mode === "code" ? <CodePanel line={step.line} valid={step.valid} /> : <LearningPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}

function describe(id: ProblemId, s: any): string {
  return id === "perm" ? `perm = [${s.perm.join(", ")}]` : `chosen = {${s.chosen.map((k: number) => s.nums[k]).join(", ")}}, sum = ${s.sum}`;
}

function Ctl({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return <button onClick={onClick} aria-label={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent">{children}</button>;
}
function Stat({ k, v, tone }: { k: string; v: string | number; tone?: string }) {
  return (
    <div className="bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className={cn("font-mono text-lg", tone)}>{v}</div>
    </div>
  );
}
function Legend({ cls, t }: { cls: string; t: string }) {
  return <span className="flex items-center gap-1"><span className={cn("h-2.5 w-2.5 rounded-full", cls)} />{t}</span>;
}
