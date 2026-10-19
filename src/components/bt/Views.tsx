import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AnyState, PermState, ProblemId, SubsetState } from "@/lib/bt/algorithms";
import type { Step } from "@/lib/bt/recorder";




function Tokens({ items, cls }: { items: (string | number)[]; cls?: string }) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-center gap-2">
      <AnimatePresence mode="popLayout">
        {items.map((x, i) => (
          <motion.div layout key={`${i}-${x}`} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className={cn("flex h-12 w-12 items-center justify-center rounded-md border border-primary/60 bg-primary/15 font-mono text-xl text-primary", cls)}>{x}</motion.div>
        ))}
      </AnimatePresence>
      {items.length === 0 && <span className="font-mono text-muted-foreground">∅ empty</span>}
    </div>
  );
}

function Results({ list }: { list: string[] }) {
  if (!list.length) return null;
  return (
    <div className="mt-4 w-full">
      <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Found ({list.length})</div>
      <div className="flex flex-wrap gap-1.5">
        {list.map((r, i) => <span key={i} className="rounded border border-success/40 bg-success/10 px-2 py-0.5 font-mono text-xs text-success">{r}</span>)}
      </div>
    </div>
  );
}


function Perm({ s }: { s: PermState }) {
  return (
    <div className="w-full max-w-md space-y-5">
      <div>
        <div className="mb-2 text-center text-xs uppercase tracking-wider text-muted-foreground">Available numbers</div>
        <div className="flex justify-center gap-2">
          {Array.from({ length: s.n }, (_, i) => i + 1).map((x) => (
            <div key={x} className={cn("flex h-10 w-10 items-center justify-center rounded-md border font-mono transition-all",
              s.used[x] ? "border-border text-muted-foreground opacity-40" : "border-border text-foreground",
              s.trying === x && "ring-2 ring-warning")}>{x}</div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-center text-xs uppercase tracking-wider text-muted-foreground">Current permutation</div>
        <Tokens items={s.perm} />
      </div>
      <Results list={s.results} />
    </div>
  );
}


function Subset({ s }: { s: SubsetState }) {
  return (
    <div className="w-full max-w-md space-y-5">
      <div className="flex flex-wrap justify-center gap-2">
        {s.nums.map((x, i) => (
          <div key={i} className={cn("flex h-12 min-w-12 items-center justify-center rounded-md border px-2 font-mono text-lg transition-all",
            s.chosen.includes(i) ? "border-success bg-success/15 text-success" : i < s.index ? "border-border text-muted-foreground line-through opacity-50" : "border-border",
            i === s.index && "ring-2 ring-warning")}>{x}</div>
        ))}
      </div>
      <div className="text-center font-mono">
        <span className="text-muted-foreground">sum = </span>
        <span className={cn("text-3xl", s.sum === s.target ? "text-success" : s.sum > s.target ? "text-destructive" : "text-primary")}>{s.sum}</span>
        <span className="text-muted-foreground"> / target {s.target}</span>
        <div className="mx-auto mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full bg-primary" animate={{ width: `${Math.min(100, (s.sum / Math.max(1, s.target)) * 100)}%` }} />
        </div>
      </div>
      <Results list={s.results} />
    </div>
  );
}

export function ProblemView({ id, step }: { id: ProblemId; step: Step<AnyState> }) {
  const s = step.state;
  return id === "perm" ? <Perm s={s as PermState} /> : <Subset s={s as SubsetState} />;
}
