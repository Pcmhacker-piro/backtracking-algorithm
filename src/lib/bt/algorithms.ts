import { L, Recorder, type Recording } from "./recorder";

export type ProblemId = "nqueens" | "maze" | "binary" | "perm" | "sudoku" | "subset";

export interface Params {
  n: number; // queens size / binary length / perm size
  noAdjacentOnes: boolean;
  nums: number[];
  target: number;
  findAll: boolean;
}

export const PROBLEMS: { id: ProblemId; name: string; blurb: string }[] = [
  { id: "nqueens", name: "N-Queens", blurb: "Place N queens so none attack each other." },
  { id: "maze", name: "Maze Solver", blurb: "Find a path from S to E avoiding walls." },
  { id: "binary", name: "Binary Strings", blurb: "Generate every binary string of length n." },
  { id: "perm", name: "Permutations", blurb: "Build every ordering of 1..n." },
  { id: "sudoku", name: "Sudoku (4×4)", blurb: "Fill the grid so rows, columns and boxes have 1–4." },
  { id: "subset", name: "Subset Sum", blurb: "Choose numbers that add up to the target." },
];

/* ---------- state shapes ---------- */
export interface QueensState { n: number; queens: number[]; current: [number, number] | null; conflicts: [number, number][]; tried: number[][] }
export interface MazeState { grid: string[]; path: [number, number][]; current: [number, number] | null; dead: string[] }
export interface BinaryState { n: number; str: string; results: string[] }
export interface PermState { n: number; perm: number[]; used: boolean[]; trying: number | null; results: string[] }
export interface SudokuState { grid: number[][]; given: boolean[][]; current: [number, number] | null; trying: number | null; bad: boolean }
export interface SubsetState { nums: number[]; target: number; index: number; chosen: number[]; sum: number; results: string[] }

export type AnyState = QueensState | MazeState | BinaryState | PermState | SudokuState | SubsetState;

const MAX_STEPS = 5000;

export function runNQueens(n: number, findAll: boolean): Recording<QueensState> {
  const queens = Array(n).fill(-1);
  const tried: number[][] = Array.from({ length: n }, () => []);
  let current: [number, number] | null = null;
  let conflicts: [number, number][] = [];
  const rec = new Recorder<QueensState>(
    () => ({ n, queens: [...queens], current, conflicts: [...conflicts], tried: tried.map((t) => [...t]) }),
    MAX_STEPS, findAll ? Infinity : 1,
  );
  const attackers = (r: number, c: number) => {
    const out: [number, number][] = [];
    for (let i = 0; i < r; i++) {
      const q = queens[i];
      if (q === c || Math.abs(q - c) === r - i) out.push([i, q]);
    }
    return out;
  };
  const bt = (r: number) => {
    if (rec.stop) return;
    current = null; conflicts = [];
    rec.step(L.base, r === n ? `All ${n} rows filled — this is complete!` : `Row ${r + 1}: not complete yet (${r}/${n} queens placed).`);
    if (r === n) {
      rec.solution();
      rec.step(L.process, `Solution #${rec.solutions} found! Every queen is safe.`, "", true);
      rec.checkSolutionLimit();
      rec.step(L.ret, "Returning to look for other placements.");
      return;
    }
    tried[r] = [];
    for (let c = 0; c < n && !rec.stop; c++) {
      current = [r, c]; conflicts = [];
      rec.step(L.loop, `Trying to place a queen in row ${r + 1}, column ${c + 1}.`, `row ${r + 1} → col ${c + 1}`);
      const att = attackers(r, c);
      if (att.length === 0) {
        rec.step(L.valid, "The position is safe. No queen attacks this cell.", `row ${r + 1} → col ${c + 1}`, true);
        queens[r] = c;
        rec.step(L.make, `Placing queen at (${r + 1}, ${c + 1}).`, `row ${r + 1} → col ${c + 1}`, true);
        rec.enter(`${r + 1},${c + 1}`);
        rec.step(L.recurse, `Moving to the next row (${r + 2}).`);
        bt(r + 1);
        rec.exit();
        if (rec.stop) return;
        queens[r] = -1; rec.undo();
        current = [r, c]; conflicts = [];
        tried[r].push(c);
        rec.step(L.undo, `Removing the queen at (${r + 1}, ${c + 1}) and trying another position.`, `undo col ${c + 1}`);
      } else {
        conflicts = att;
        rec.prune(`${r + 1},${c + 1}`);
        tried[r].push(c);
        rec.step(L.valid, `This position conflicts with the queen at (${att[0][0] + 1}, ${att[0][1] + 1}).`, `row ${r + 1} → col ${c + 1}`, false);
      }
    }
    current = null; conflicts = [];
    if (!rec.stop) rec.step(L.end, r === 0 ? "All columns of row 1 explored. Search finished." : `No valid positions remain in row ${r + 1}. Returning to row ${r}.`);
  };
  bt(0);
  return rec.result();
}

export const MAZE = [
  "S.#....",
  ".##.##.",
  "...#...",
  "#.#..#.",
  "..#.##.",
  ".##...#",
  "....#.E",
];

export function runMaze(findAll: boolean): Recording<MazeState> {
  const R = MAZE.length, C = MAZE[0].length;
  const path: [number, number][] = [[0, 0]];
  const onPath = new Set(["0,0"]);
  const dead = new Set<string>();
  let current: [number, number] | null = [0, 0];
  const rec = new Recorder<MazeState>(() => ({ grid: MAZE, path: path.map((p) => [...p] as [number, number]), current, dead: [...dead] }), MAX_STEPS, findAll ? Infinity : 1);
  const dirs: [number, number, string][] = [[1, 0, "down"], [0, 1, "right"], [-1, 0, "up"], [0, -1, "left"]];
  const bt = (r: number, c: number) => {
    if (rec.stop) return;
    current = [r, c];
    const atEnd = MAZE[r][c] === "E";
    rec.step(L.base, atEnd ? "Reached the exit E!" : `At (${r}, ${c}). Not the exit yet.`);
    if (atEnd) {
      rec.solution();
      rec.step(L.process, `Path #${rec.solutions} found with ${path.length} cells.`, "", true);
      rec.checkSolutionLimit();
      rec.step(L.ret, "Returning to explore other routes.");
      return;
    }
    for (const [dr, dc, name] of dirs) {
      if (rec.stop) return;
      const nr = r + dr, nc = c + dc;
      current = [nr, nc];
      rec.step(L.loop, `Trying to move ${name} to (${nr}, ${nc}).`, `move ${name}`);
      const inside = nr >= 0 && nc >= 0 && nr < R && nc < C;
      const reason = !inside ? "outside the maze" : MAZE[nr][nc] === "#" ? "a wall" : onPath.has(`${nr},${nc}`) ? "already on the current path" : "";
      if (reason) {
        rec.prune(name[0].toUpperCase());
        rec.step(L.valid, `Can't move ${name}: that cell is ${reason}.`, `move ${name}`, false);
        continue;
      }
      rec.step(L.valid, `(${nr}, ${nc}) is open. Valid move.`, `move ${name}`, true);
      path.push([nr, nc]); onPath.add(`${nr},${nc}`);
      rec.step(L.make, `Stepping ${name} — adding (${nr}, ${nc}) to the path.`, `move ${name}`, true);
      rec.enter(`${nr},${nc}`);
      rec.step(L.recurse, `Exploring onward from (${nr}, ${nc}).`);
      bt(nr, nc);
      rec.exit();
      if (rec.stop) return;
      path.pop(); onPath.delete(`${nr},${nc}`); rec.undo();
      dead.add(`${nr},${nc}`);
      current = [r, c];
      rec.step(L.undo, `Dead end. Stepping back from (${nr}, ${nc}) to (${r}, ${c}).`, `undo ${name}`);
    }
    current = [r, c];
    if (!rec.stop) rec.step(L.end, `All directions from (${r}, ${c}) explored. Backtracking.`);
  };
  bt(0, 0);
  return rec.result();
}

export function runBinary(n: number, noAdj: boolean): Recording<BinaryState> {
  let str = "";
  const results: string[] = [];
  const rec = new Recorder<BinaryState>(() => ({ n, str, results: [...results] }), MAX_STEPS, Infinity);
  const bt = () => {
    if (rec.stop) return;
    rec.step(L.base, str.length === n ? `"${str}" has length ${n} — complete.` : `Current string "${str || "∅"}" has length ${str.length} of ${n}.`);
    if (str.length === n) {
      rec.solution(); results.push(str);
      rec.step(L.process, `Recording string #${results.length}: ${str}`, "", true);
      rec.step(L.ret, "Returning to try the other bit.");
      return;
    }
    for (const b of ["0", "1"]) {
      if (rec.stop) return;
      rec.step(L.loop, `Trying to append '${b}' to "${str || "∅"}".`, `append ${b}`);
      if (noAdj && b === "1" && str.endsWith("1")) {
        rec.prune(b);
        rec.step(L.valid, "Invalid: this would create two adjacent 1s. Pruning this branch.", `append ${b}`, false);
        continue;
      }
      rec.step(L.valid, `'${b}' is allowed here.`, `append ${b}`, true);
      str += b;
      rec.step(L.make, `String is now "${str}".`, `append ${b}`, true);
      rec.enter(b);
      rec.step(L.recurse, "Recursing to choose the next bit.");
      bt();
      rec.exit();
      if (rec.stop) return;
      str = str.slice(0, -1); rec.undo();
      rec.step(L.undo, `Removing the last '${b}' → "${str || "∅"}".`, `undo ${b}`);
    }
    if (!rec.stop) rec.step(L.end, "Both bits tried at this position. Returning.");
  };
  bt();
  return rec.result();
}

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

export const SUDOKU = [
  [1, 0, 0, 4],
  [0, 0, 1, 0],
  [0, 1, 0, 0],
  [4, 0, 0, 1],
];

export function runSudoku(findAll: boolean): Recording<SudokuState> {
  const grid = SUDOKU.map((r) => [...r]);
  const given = SUDOKU.map((r) => r.map((v) => v !== 0));
  let current: [number, number] | null = null;
  let trying: number | null = null;
  let bad = false;
  const rec = new Recorder<SudokuState>(() => ({ grid: grid.map((r) => [...r]), given, current, trying, bad }), MAX_STEPS, findAll ? Infinity : 1);
  const ok = (r: number, c: number, v: number) => {
    for (let i = 0; i < 4; i++) if (grid[r][i] === v || grid[i][c] === v) return false;
    const br = r - (r % 2), bc = c - (c % 2);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if (grid[br + i][bc + j] === v) return false;
    return true;
  };
  const bt = () => {
    if (rec.stop) return;
    let r = -1, c = -1;
    outer: for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (grid[i][j] === 0) { r = i; c = j; break outer; }
    current = r >= 0 ? [r, c] : null; trying = null; bad = false;
    rec.step(L.base, r < 0 ? "No empty cells left — the grid is solved!" : `Next empty cell is (${r + 1}, ${c + 1}).`);
    if (r < 0) {
      rec.solution();
      rec.step(L.process, "Sudoku solved! Every row, column and box is valid.", "", true);
      rec.checkSolutionLimit();
      rec.step(L.ret, "Returning.");
      return;
    }
    for (let v = 1; v <= 4 && !rec.stop; v++) {
      current = [r, c]; trying = v; bad = false;
      rec.step(L.loop, `Trying ${v} in cell (${r + 1}, ${c + 1}).`, `cell(${r + 1},${c + 1}) = ${v}`);
      if (!ok(r, c, v)) {
        bad = true;
        rec.prune(`${v}`);
        rec.step(L.valid, `${v} already appears in this row, column or box.`, `cell(${r + 1},${c + 1}) = ${v}`, false);
        continue;
      }
      rec.step(L.valid, `${v} fits here.`, `cell(${r + 1},${c + 1}) = ${v}`, true);
      grid[r][c] = v;
      rec.step(L.make, `Writing ${v} into (${r + 1}, ${c + 1}).`, `cell(${r + 1},${c + 1}) = ${v}`, true);
      rec.enter(`${v}`);
      rec.step(L.recurse, "Moving on to the next empty cell.");
      bt();
      rec.exit();
      if (rec.stop) return;
      grid[r][c] = 0; rec.undo(); current = [r, c]; trying = v; bad = false;
      rec.step(L.undo, `Erasing ${v} from (${r + 1}, ${c + 1}) — it led to a dead end.`, `undo ${v}`);
    }
    trying = null;
    if (!rec.stop) rec.step(L.end, `No digit works in (${r + 1}, ${c + 1}). Going back.`);
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
  switch (id) {
    case "nqueens": return runNQueens(Math.min(8, Math.max(4, p.n)), p.findAll);
    case "maze": return runMaze(p.findAll);
    case "binary": return runBinary(Math.min(4, Math.max(1, p.n)), p.noAdjacentOnes);
    case "perm": return runPerm(Math.min(4, Math.max(1, p.n)));
    case "sudoku": return runSudoku(p.findAll);
    case "subset": return runSubset(p.nums, p.target, p.findAll);
  }
}
