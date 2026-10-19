import { cn } from "@/lib/utils";
import type { ProblemId } from "@/lib/bt/algorithms";

// Real C++ per algorithm; `map` translates the recorder's generic line ids to lines below.
const SOURCES: Record<ProblemId, { file: string; code: string[]; map: Record<number, number> }> = {
  perm: {
    file: "permutations.cpp",
    code: [
      "void permute(vector<int>& cur, vector<bool>& used, int n) {",
      "    if (cur.size() == n) {",
      "        result.push_back(cur);",
      "        return;",
      "    }",
      "    for (int x = 1; x <= n; ++x) {",
      "        if (used[x]) continue; // prune",
      "        cur.push_back(x); used[x] = true; // choose",
      "        permute(cur, used, n); // explore",
      "        cur.pop_back();   used[x] = false; // undo",
      "    }",
      "}",
    ],
    map: { 1: 1, 2: 2, 3: 3, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 12: 11 },
  },
  subset: {
    file: "subset_sum.cpp",
    code: [
      "void subsetSum(int i, int sum) {",
      "    if (sum == target) { record(chosen); return; }",
      "    if (i == n) return;",
      "    for (bool take : {true, false}) {",
      "        if (take && sum + a[i] > target) continue; // prune",
      "        if (take) chosen.push_back(a[i]); // choose",
      "        subsetSum(i + 1, sum + (take ? a[i] : 0)); // explore",
      "        if (take) chosen.pop_back(); // undo",
      "    }",
      "}",
    ],
    map: { 1: 1, 2: 1, 3: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 12: 9 },
  },
};

export const LINE_INFO: Record<number, string> = {
  1: "Base case — is the current state a complete answer?",
  2: "Complete, valid answer reached — record it.",
  3: "Return to the caller (pop one stack frame).",
  5: "Iterate over every candidate at this level.",
  6: "Constraint check. Invalid candidates are pruned.",
  7: "Choose — apply the candidate to the state.",
  8: "Explore — recurse one level deeper.",
  9: "Undo — revert the choice to restore state.",
  12: "Candidates exhausted — frame ends, backtrack.",
};

export function CodePanel({ problem, line, valid }: { problem: ProblemId; line: number; valid: boolean | null }) {
  const src = SOURCES[problem];
  const active = src.map[line] ?? 0;
  const tone = line === 9 || line === 12 ? "warn" : line === 6 && valid === false ? "bad" : line === 2 ? "ok" : "cur";
  return (
    <div className="overflow-hidden rounded-md border border-border bg-muted/40">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-2 font-mono text-[11px] text-muted-foreground">{src.file}</span>
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">C++17</span>
      </div>
      <pre className="overflow-x-auto py-2 font-mono text-[11px] leading-6 [font-variant-ligatures:none]">
        {src.code.map((t, i) => {
          const on = i === active;
          return (
            <div key={i} className={cn("flex min-w-max border-l-2 border-transparent pr-4 transition-colors duration-150",
              on && tone === "cur" && "border-primary bg-primary/10", on && tone === "warn" && "border-warning bg-warning/15",
              on && tone === "bad" && "border-destructive bg-destructive/10", on && tone === "ok" && "border-success bg-success/10")}>
              <span className="w-9 shrink-0 select-none pr-3 text-right text-muted-foreground/50">{i + 1}</span>
              <span className={cn("whitespace-pre", on ? "text-foreground" : "text-muted-foreground")}>{t}</span>
            </div>
          );
        })}
      </pre>
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="font-mono text-primary">L{active + 1}</span> · {LINE_INFO[line] ?? ""}
      </div>
    </div>
  );
}
