import { useEffect, useMemo, useRef } from "react";
import type { TreeNode } from "@/lib/bt/recorder";

const DX = 34, DY = 52, PAD = 24;

export function RecursionTree({ nodes, at, active, onPick }: { nodes: TreeNode[]; at: number; active: number; onPick: (n: TreeNode) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useMemo(() => nodes.filter((n) => n.createdAt <= at), [nodes, at]);

  const { pos, w, h } = useMemo(() => {
    const kids = new Map<number, number[]>();
    for (const n of visible) if (n.parent >= 0) (kids.get(n.parent) ?? kids.set(n.parent, []).get(n.parent)!).push(n.id);
    const pos = new Map<number, { x: number; y: number }>();
    let leaf = 0, maxD = 0;
    const lay = (id: number, d: number): number => {
      maxD = Math.max(maxD, d);
      const ch = kids.get(id) ?? [];
      const x = ch.length ? ch.map((c) => lay(c, d + 1)).reduce((a, b, _i, arr) => a + b / arr.length, 0) : leaf++;
      pos.set(id, { x, y: d });
      return x;
    };
    if (visible.length) lay(0, 0);
    return { pos, w: Math.max(1, leaf) * DX + PAD * 2, h: (maxD + 1) * DY + PAD };
  }, [visible]);

  const px = (id: number) => { const p = pos.get(id)!; return { x: PAD + p.x * DX, y: PAD + p.y * DY }; };

  useEffect(() => {
    const el = ref.current; const p = pos.get(active);
    if (!el || !p) return;
    const { x, y } = { x: PAD + p.x * DX, y: PAD + p.y * DY };
    el.scrollTo({ left: x - el.clientWidth / 2, top: y - el.clientHeight / 2, behavior: "smooth" });
  }, [active, pos]);

  const onPath = useMemo(() => {
    const s = new Set<number>(); let c = active;
    const byId = new Map(nodes.map((n) => [n.id, n]));
    while (c >= 0) { s.add(c); c = byId.get(c)?.parent ?? -1; }
    return s;
  }, [active, nodes]);

  return (
    <div ref={ref} className="h-64 overflow-auto rounded-md bg-muted/40">
      <svg width={w} height={h} className="font-mono">
        {visible.map((n) => n.parent >= 0 && pos.has(n.parent) && (() => {
          const a = px(n.parent), b = px(n.id);
          const cls = n.status === "pruned" ? "stroke-destructive/50" : onPath.has(n.id) ? "stroke-primary" : "stroke-muted-foreground/40";
          return <line key={`e${n.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={onPath.has(n.id) ? 2 : 1} strokeDasharray={n.status === "pruned" ? "3 3" : undefined} className={cls} />;
        })())}
        {visible.map((n) => {
          const { x, y } = px(n.id);
          const sol = n.status === "solution" && n.statusAt <= at;
          const isActive = n.id === active;
          const returned = n.exitAt <= at && n.status === "normal";
          const fill = n.status === "pruned" ? "fill-destructive/20 stroke-destructive" : sol ? "fill-success/30 stroke-success" : isActive ? "fill-primary stroke-primary" : onPath.has(n.id) ? "fill-primary/25 stroke-primary" : returned ? "fill-muted stroke-border" : "fill-card stroke-muted-foreground";
          return (
            <g key={n.id} onClick={() => onPick(n)} className="cursor-pointer">
              {isActive && <circle cx={x} cy={y} r={17} className="animate-pulse fill-primary/15" />}
              <circle cx={x} cy={y} r={12} strokeWidth={1.5} className={fill} />
              <text x={x} y={y + 3.5} textAnchor="middle" fontSize={n.label.length > 3 ? 7 : 9}
                className={isActive ? "fill-primary-foreground" : n.status === "pruned" ? "fill-destructive" : "fill-foreground"}>
                {n.status === "pruned" ? "✕" : n.label === "start" ? "●" : n.label}
              </text>
              <title>{`${n.label} — ${n.status}${n.status === "pruned" ? " (invalid branch)" : ""}. Click to jump here.`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
