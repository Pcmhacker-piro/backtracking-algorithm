import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  AnyState, BinaryState, MazeState, PermState, ProblemId, QueensState, SubsetState, SudokuState,
} from "@/lib/bt/algorithms";
import type { Step } from "@/lib/bt/recorder";

const Crown = () => <span className="text-xl leading-none sm:text-2xl">♛</span>;

function Queens({ s, step }: { s: QueensState; step: Step<AnyState> }) {
  const has = (arr: [number, number][], r: number, c: number) => arr.some(([a, b]) => a === r && b === c);
  const solved = step.line === 2;
  return (
    <div className="grid aspect-square w-full max-w-[420px] border border-border" style={{ gridTemplateColumns: `repeat(${s.n}, 1fr)` }}>
      {Array.from({ length: s.n * s.n }, (_, i) => {
        const r = Math.floor(i / s.n), c = i % s.n;
        const isQ = s.queens[r] === c;
        const isCur = s.current?.[0] === r && s.current?.[1] === c;
        const isConflict = has(s.conflicts, r, c);
        const tried = s.tried[r]?.includes(c) && !isQ && !isCur;
        return (
          <div key={i} className={cn("relative flex items-center justify-center transition-colors duration-200", (r + c) % 2 ? "bg-board-dark" : "bg-board-light")}>
            {tried && <span className="absolute h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />}
            {isCur && (
              <motion.div layoutId="cursor" className={cn("absolute inset-0.5 rounded-sm border-2",
                step.valid === false ? "border-destructive bg-destructive/25" : step.line === 9 ? "border-warning bg-warning/20" : step.valid ? "border-success bg-success/20" : "border-primary bg-primary/15")} />
            )}
            {isConflict && <div className="absolute inset-0.5 rounded-sm border-2 border-destructive" />}
            <AnimatePresence>
              {isQ && (
                <motion.div initial={{ scale: 0, y: -12, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0, rotate: 45, opacity: 0 }}
                  className={cn("relative z-10", solved ? "text-success drop-shadow-[var(--shadow-glow)]" : isConflict ? "text-destructive" : "text-primary")}>
                  <Crown />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function Maze({ s }: { s: MazeState }) {
  const idx = (r: number, c: number) => s.path.findIndex(([a, b]) => a === r && b === c);
  return (
    <div className="grid w-full max-w-[420px] gap-1" style={{ gridTemplateColumns: `repeat(${s.grid[0].length}, 1fr)` }}>
      {s.grid.flatMap((row, r) => row.split("").map((ch, c) => {
        const p = idx(r, c);
        const cur = s.current?.[0] === r && s.current?.[1] === c;
        const dead = s.dead.includes(`${r},${c}`) && p < 0;
        return (
          <div key={`${r}-${c}`} className={cn("relative flex aspect-square items-center justify-center rounded-sm font-mono text-xs transition-colors duration-200",
            ch === "#" ? "bg-secondary" : p >= 0 ? "bg-primary/30" : dead ? "bg-destructive/15" : "bg-board-light",
            cur && "ring-2 ring-warning")}>
            {ch === "S" ? <b className="text-success">S</b> : ch === "E" ? <b className="text-warning">E</b> : p >= 0 ? <span className="text-primary">{p}</span> : ch === "#" ? "" : ""}
          </div>
        );
      }))}
    </div>
  );
}

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

function Binary({ s }: { s: BinaryState }) {
  const slots = Array.from({ length: s.n }, (_, i) => s.str[i] ?? "_");
  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center gap-2">
        {slots.map((b, i) => (
          <motion.div key={`${i}-${b}`} initial={{ scale: 0.6 }} animate={{ scale: 1 }}
            className={cn("flex h-14 w-14 items-center justify-center rounded-md border font-mono text-2xl", b === "_" ? "border-dashed border-border text-muted-foreground" : "border-primary/60 bg-primary/15 text-primary")}>{b}</motion.div>
        ))}
      </div>
      <Results list={s.results} />
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

function Sudoku({ s, step }: { s: SudokuState; step: Step<AnyState> }) {
  return (
    <div className="grid aspect-square w-full max-w-[340px] grid-cols-4 gap-0 overflow-hidden rounded-md border-2 border-primary/50">
      {s.grid.flatMap((row, r) => row.map((v, c) => {
        const cur = s.current?.[0] === r && s.current?.[1] === c;
        const show = cur && s.trying && v === 0 ? s.trying : v;
        return (
          <div key={`${r}-${c}`} className={cn("relative flex items-center justify-center border border-border font-mono text-3xl",
            c === 1 && "border-r-2 border-r-primary/50", r === 1 && "border-b-2 border-b-primary/50",
            cur && (s.bad ? "bg-destructive/25" : step.line === 9 ? "bg-warning/20" : "bg-primary/15"),
            step.line === 2 && "bg-success/10")}>
            <AnimatePresence mode="wait">
              {show ? (
                <motion.span key={show} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: cur && v === 0 ? 0.6 : 1 }} exit={{ scale: 0.4, opacity: 0 }}
                  className={s.given[r][c] ? "text-foreground" : cur && s.bad ? "text-destructive" : step.line === 2 ? "text-success" : "text-primary"}>{show}</motion.span>
              ) : null}
            </AnimatePresence>
          </div>
        );
      }))}
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
  switch (id) {
    case "nqueens": return <Queens s={s as QueensState} step={step} />;
    case "maze": return <Maze s={s as MazeState} />;
    case "binary": return <Binary s={s as BinaryState} />;
    case "perm": return <Perm s={s as PermState} />;
    case "sudoku": return <Sudoku s={s as SudokuState} step={step} />;
    case "subset": return <Subset s={s as SubsetState} />;
  }
}
