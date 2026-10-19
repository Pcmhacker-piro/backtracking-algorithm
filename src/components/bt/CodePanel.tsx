import { cn } from "@/lib/utils";

const CODE = [
  "void backtrack(State& state) {",
  "    if (isComplete(state)) {",
  "        processSolution(state);",
  "        return;",
  "    }",
  "    for (auto choice : getChoices(state)) {",
  "        if (isValid(state, choice)) {",
  "            makeChoice(state, choice);",
  "            backtrack(state);",
  "            undoChoice(state, choice);",
  "        }",
  "    }",
  "}",
];

export const LINE_INFO: Record<number, string> = {
  1: "Base case: is the current state a full answer?",
  2: "A complete, valid answer was reached — record it.",
  3: "Return to the caller (go back up one level).",
  5: "Loop over every option available at this level.",
  6: "Check constraints. Invalid choices are pruned immediately.",
  7: "Choose: apply the choice to the state.",
  8: "Explore: recurse one level deeper with the new state.",
  9: "Undo: revert the choice so the next option starts clean.",
  12: "All choices exhausted — this call ends and we backtrack.",
};

export function CodePanel({ line, valid }: { line: number; valid: boolean | null }) {
  return (
    <div>
      <pre className="overflow-x-auto rounded-md bg-background/60 py-2 font-mono text-[12.5px] leading-6">
        {CODE.map((t, i) => {
          const on = i === line;
          const tone = on ? (line === 9 || line === 12 ? "warn" : line === 6 && valid === false ? "bad" : line === 2 ? "ok" : "cur") : "";
          return (
            <div key={i} className={cn("flex border-l-2 border-transparent pr-3 transition-colors",
              tone === "cur" && "border-primary bg-primary/15", tone === "warn" && "border-warning bg-warning/15",
              tone === "bad" && "border-destructive bg-destructive/15", tone === "ok" && "border-success bg-success/15")}>
              <span className="w-8 shrink-0 select-none pr-3 text-right text-muted-foreground/60">{i + 1}</span>
              <span className={cn("whitespace-pre", on ? "text-foreground" : "text-muted-foreground")}>{t}</span>
            </div>
          );
        })}
      </pre>
      <p className="mt-2 text-sm text-muted-foreground"><span className="font-mono text-primary">line {line + 1}:</span> {LINE_INFO[line] ?? ""}</p>
    </div>
  );
}
