import { L, Recorder, type Recording } from "./recorder";

export type ProblemId = "perm" | "subset";

export interface Params {
  n: number;
  nums: number[];
  target: number;
  findAll: boolean;
}

export const PROBLEMS: { id: ProblemId; name: string; blurb: string }[] = [
  { id: "perm", name: "Permutations", blurb: "Enumerate every ordering of 1..n using a used[] mask." },
  { id: "subset", name: "Subset Sum", blurb: "Include / exclude decisions with sum-based pruning." },
];

export interface PermState { n: number; perm: number[]; used: boolean[]; trying: number | null; results: string[] }
export interface SubsetState { nums: number[]; target: number; index: number; chosen: number[]; sum: number; results: string[] }
export type AnyState = PermState | SubsetState;

const MAX_STEPS = 5000;

export function runPerm(n: number): Recording<PermState> {
  const perm: number[] = [];
  const used = Array(n + 1).fill(false);
  const results: string[] = [];
  let trying: number | null = null;
  const rec = new Recorder<PermState>(() => ({ n, perm: [...perm], used: [...used], trying, results: [...results] }), MAX_STEPS, Infinity);
  const bt = () => {
    if (rec.stop) return;
    trying = null;
    rec.step(L.base, perm.length === n ? `[${perm.join(", ")}] uses all ${n} numbers.` : `Permutation has ${perm.length} of ${n} numbers.`);
    if (perm.length === n) {
      rec.solution(); results.push(perm.join(""));
      rec.step(L.process, `Permutation #${results.length}: ${perm.join(" ")}`, "", true);
      rec.step(L.ret, "Returning to try other orders.");
      return;
    }
    for (let x = 1; x <= n && !rec.stop; x++) {
      trying = x;
      rec.step(L.loop, `Trying to place ${x} at position ${perm.length + 1}.`, `pick ${x}`);
      if (used[x]) {
        rec.prune(String(x));
        rec.step(L.valid, `${x} is already used. Skip it.`, `pick ${x}`, false);
        continue;
      }
      rec.step(L.valid, `${x} is unused. Valid choice.`, `pick ${x}`, true);
      perm.push(x); used[x] = true;
      rec.step(L.make, `Placed ${x} → [${perm.join(", ")}].`, `pick ${x}`, true);
      rec.enter(String(x));
      rec.step(L.recurse, "Recursing to fill the next position.");
      bt();
      rec.exit();
      if (rec.stop) return;
      perm.pop(); used[x] = false; rec.undo(); trying = x;
      rec.step(L.undo, `Removing ${x} so it can be used elsewhere.`, `undo ${x}`);
    }
    trying = null;
    if (!rec.stop) rec.step(L.end, "All numbers tried at this position. Returning.");
  };
  bt();
  return rec.result();
}

export function runSubset(nums: number[], target: number, findAll: boolean): Recording<SubsetState> {
  const chosen: number[] = [];
  let sum = 0, index = 0;
  const results: string[] = [];
  const rec = new Recorder<SubsetState>(() => ({ nums, target, index, chosen: [...chosen], sum, results: [...results] }), MAX_STEPS, findAll ? Infinity : 1);
  const bt = (i: number) => {
    if (rec.stop) return;
    index = i;
    if (sum === target) {
      rec.step(L.base, `Sum is ${sum} — equals the target ${target}!`);
      rec.solution();
      const s = `{${chosen.map((k) => nums[k]).join(", ")}}`;
      results.push(s);
      rec.step(L.process, `Subset found: ${s}`, "", true);
      rec.checkSolutionLimit();
      rec.step(L.ret, "Returning to search for more subsets.");
      return;
    }
    rec.step(L.base, i === nums.length ? `No numbers left and sum ${sum} ≠ ${target}. Dead end.` : `Sum ${sum} ≠ ${target}. Deciding about ${nums[i]}.`);
    if (i === nums.length) { rec.step(L.ret, "Returning."); return; }
    for (const inc of [true, false]) {
      if (rec.stop) return;
      const label = inc ? `+${nums[i]}` : `−${nums[i]}`;
      const d = inc ? `include ${nums[i]}` : `exclude ${nums[i]}`;
      rec.step(L.loop, inc ? `Trying to include ${nums[i]}.` : `Trying to exclude ${nums[i]}.`, d);
      if (inc && sum + nums[i] > target) {
        rec.prune(label);
        rec.step(L.valid, `Including ${nums[i]} gives ${sum + nums[i]} > ${target}. Pruned!`, d, false);
        continue;
      }
      rec.step(L.valid, inc ? `${sum} + ${nums[i]} = ${sum + nums[i]} ≤ ${target}. OK.` : `Skipping ${nums[i]} is always allowed.`, d, true);
      if (inc) { chosen.push(i); sum += nums[i]; }
      rec.step(L.make, inc ? `Added ${nums[i]}; sum is now ${sum}.` : `Left out ${nums[i]}.`, d, true);
      rec.enter(label);
      rec.step(L.recurse, `Recursing to decide about the next number.`);
      bt(i + 1);
      rec.exit();
      if (rec.stop) return;
      index = i;
      if (inc) { chosen.pop(); sum -= nums[i]; }
      rec.undo();
      rec.step(L.undo, inc ? `Removing ${nums[i]}; sum back to ${sum}.` : `Undoing the skip of ${nums[i]}.`, `undo ${d}`);
    }
    if (!rec.stop) rec.step(L.end, `Both choices for ${nums[i]} explored. Returning.`);
  };
  bt(0);
  return rec.result();
}

export function run(id: ProblemId, p: Params): Recording<AnyState> {
  return id === "perm" ? runPerm(Math.min(5, Math.max(1, p.n))) : runSubset(p.nums, p.target, p.findAll);
}
