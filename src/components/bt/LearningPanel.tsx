const SECTIONS: { t: string; b: string[] }[] = [
  { t: "What is backtracking?", b: ["A systematic way to try every possibility by building a solution one choice at a time, and abandoning (backtracking from) a partial solution the moment it can't lead to a valid answer."] },
  { t: "Choose → Explore → Undo", b: ["Choose: pick one option and apply it.", "Explore: recurse to solve the smaller remaining problem.", "Undo: remove the choice so the next option starts from the same state."] },
  { t: "Recursion & the base case", b: ["Each recursive call handles one level (a row, a position, a cell).", "The base case stops recursion when the state is complete — that's where solutions are recorded."] },
  { t: "Valid vs. invalid choices", b: ["A valid choice keeps all constraints satisfied, so we go deeper.", "An invalid choice breaks a rule (two queens attack, a wall, a reused number) and is skipped."] },
  { t: "Pruning", b: ["Rejecting an invalid choice early cuts off its entire subtree. The red ✕ nodes in the tree are pruned branches — work we never had to do."] },
  { t: "Complexity", b: ["Time is often exponential: O(bᵈ) for branching factor b and depth d (N-Queens ≈ O(N!), permutations O(n·n!), subsets O(2ⁿ)).", "Space is O(d) for the recursion stack plus the current state."] },
  { t: "Common beginner mistakes", b: ["Forgetting to undo the choice after recursing.", "Missing or wrong base case → infinite recursion.", "Checking validity too late, so nothing gets pruned.", "Storing a reference to the state instead of a copy when saving a solution."] },
];

export function LearningPanel() {
  return (
    <div className="space-y-4 text-sm">
      {SECTIONS.map((s, i) => (
        <section key={s.t}>
          <h3 className="mb-1 font-semibold text-foreground"><span className="mr-2 font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>{s.t}</h3>
          <ul className="space-y-1 text-muted-foreground">{s.b.map((x) => <li key={x} className="leading-relaxed">{x}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}
