import { describe, expect, it } from "vitest";
import { runPerm, runSubset } from "./algorithms";

describe("backtracking algorithms", () => {
  it("generates 6 permutations of 3", () => {
    expect(runPerm(3).steps.at(-1)!.solutions).toBe(6);
  });
  it("finds both subsets of [3,34,4,12,5,2] summing to 9", () => {
    expect(runSubset([3, 34, 4, 12, 5, 2], 9, true).steps.at(-1)!.solutions).toBe(2);
  });
});
