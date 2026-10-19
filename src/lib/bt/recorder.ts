// Records real algorithm execution as an immutable list of steps + a recursion tree.
export type NodeStatus = "normal" | "pruned" | "solution";

export interface TreeNode {
  id: number;
  parent: number;
  label: string;
  depth: number;
  createdAt: number; // step index at which node appears
  exitAt: number; // step index at which recursion returned from node (Infinity if never)
  status: NodeStatus;
  statusAt: number;
}

export interface Step<S> {
  line: number;
  msg: string;
  depth: number;
  calls: number;
  backs: number;
  solutions: number;
  decision: string;
  valid: boolean | null;
  state: S;
  node: number;
}

export interface Recording<S> {
  steps: Step<S>[];
  nodes: TreeNode[];
  truncated: boolean;
}

export const L = { sig: 0, base: 1, process: 2, ret: 3, loop: 5, valid: 6, make: 7, recurse: 8, undo: 9, end: 12 };

export class Recorder<S> {
  steps: Step<S>[] = [];
  nodes: TreeNode[] = [
    { id: 0, parent: -1, label: "start", depth: 0, createdAt: 0, exitAt: Infinity, status: "normal", statusAt: 0 },
  ];
  stack = [0];
  calls = 1;
  backs = 0;
  solutions = 0;
  stop = false;
  truncated = false;

  constructor(
    private snap: () => S,
    private maxSteps = 5000,
    private maxSolutions = 1,
  ) {}

  get cur() {
    return this.stack[this.stack.length - 1];
  }

  step(line: number, msg: string, decision = "", valid: boolean | null = null) {
    if (this.stop) return;
    this.steps.push({
      line, msg, decision, valid,
      depth: this.stack.length - 1,
      calls: this.calls, backs: this.backs, solutions: this.solutions,
      state: this.snap(),
      node: this.cur,
    });
    if (this.steps.length >= this.maxSteps) {
      this.stop = true;
      this.truncated = true;
    }
  }

  enter(label: string) {
    this.calls++;
    const id = this.nodes.length;
    this.nodes.push({ id, parent: this.cur, label, depth: this.stack.length, createdAt: this.steps.length, exitAt: Infinity, status: "normal", statusAt: 0 });
    this.stack.push(id);
  }

  exit() {
    const id = this.stack.pop()!;
    this.nodes[id].exitAt = this.steps.length;
  }

  undo() {
    this.backs++;
  }

  prune(label: string) {
    const at = this.steps.length;
    this.nodes.push({ id: this.nodes.length, parent: this.cur, label, depth: this.stack.length, createdAt: at, exitAt: at, status: "pruned", statusAt: at });
  }

  solution() {
    const n = this.nodes[this.cur];
    n.status = "solution";
    n.statusAt = this.steps.length;
    this.solutions++;
  }

  checkSolutionLimit() {
    if (this.solutions >= this.maxSolutions) this.stop = true;
  }

  result(): Recording<S> {
    return { steps: this.steps, nodes: this.nodes, truncated: this.truncated };
  }
}
