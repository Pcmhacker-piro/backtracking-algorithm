import { describe, expect, it } from "vitest";
import { runNQueens, runPerm, runSubset, runMaze, runSudoku, type QueensState } from "./algorithms";

describe("backtracking algorithms", () => {
  it("finds a valid 4-queens solution", () => {
    const r = runNQueens(4, false);
    const last = r.steps.at(-1)!;
    expect(last.solutions).toBe(1);
    expect((last.state as QueensState).queens).toEqual([1, 3, 0, 2]);
  });
  it("finds all 2 solutions for 4-queens", () => {
    expect(runNQueens(4, true).steps.at(-1)!.solutions).toBe(2);
  });
  it("generates 6 permutations of 3", () => {
    expect(runPerm(3).steps.at(-1)!.solutions).toBe(6);
  });
  it("finds subsets summing to 9", () => {
    expect(runSubset([3, 34, 4, 12, 5, 2], 9, true).steps.at(-1)!.solutions).toBe(2);
  });
  it("solves the maze and sudoku", () => {
    expect(runMaze(false).steps.at(-1)!.solutions).toBe(1);
    expect(runSudoku(false).steps.at(-1)!.solutions).toBe(1);
  });
});
