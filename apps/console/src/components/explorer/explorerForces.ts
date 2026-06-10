// Tiny force simulation for the Explorer — Verlet-ish, hand-rolled, no d3.
// Ported from legacy-reference/old-frontend src/dash/explorer/explorerForces.ts (clone-and-refactor, §7).
import type { OGNode, OGEdge } from './explorerTypes.js';

export type LayoutName = 'force' | 'radial' | 'cluster' | 'hierarchy' | 'embedding';

const W = 1600;
const H = 1000;
const CENTER = { x: W / 2, y: H / 2 };
const CELL = 80;

// Deterministic per-id jitter in [-0.5, 0.5) — static layouts must place the same node in the
// same spot across sim rebuilds (expand-neighbours), or every expand re-scatters the graph.
function idJitter(id: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5;
}

export interface OGSim {
  nodes: OGNode[];
  edges: OGEdge[];
  tick: () => void;
  restart: () => void;
  setLayout: (name: LayoutName, focusId?: string | null) => void;
  pin: (id: string, x: number, y: number) => void;
  unpin: (id: string) => void;
  // The live pin map — read by the page to carry pins across sim rebuilds (expand-neighbours).
  pins: () => ReadonlyMap<string, { x: number; y: number }>;
}

export function createSim(
  layoutName: LayoutName,
  nodes: OGNode[],
  edges: OGEdge[],
  focusId?: string | null
): OGSim {
  const N = nodes.length;
  const idIdx = new Map(nodes.map((n, i) => [n.id, i]));
  const edgeIdx = edges
    .map((e) => ({ s: idIdx.get(e.source) ?? -1, t: idIdx.get(e.target) ?? -1, w: e.weight }))
    .filter((e) => e.s >= 0 && e.t >= 0);

  nodes.forEach((n, i) => {
    if (n.x == null || n.x === 0) {
      const angle = (i / Math.max(1, N)) * Math.PI * 2;
      const r = 150 + (i % 7) * 40;
      n.x = CENTER.x + Math.cos(angle) * r;
      n.y = CENTER.y + Math.sin(angle) * r;
    }
    n.vx = n.vx || 0;
    n.vy = n.vy || 0;
  });

  let layout: { name: LayoutName; focusId?: string | null | undefined } = {
    name: layoutName,
    focusId,
  };
  let alpha = 1.0;
  const pinned = new Map<string, { x: number; y: number }>();

  let adjCache: Map<string, string[]> | null = null;
  function buildAdj(): Map<string, string[]> {
    if (adjCache) return adjCache;
    adjCache = new Map(nodes.map((n) => [n.id, [] as string[]]));
    edges.forEach((e) => {
      adjCache!.get(e.source)?.push(e.target);
      adjCache!.get(e.target)?.push(e.source);
    });
    return adjCache;
  }

  function setLayout(name: LayoutName, fId?: string | null): void {
    layout = { name, focusId: fId };
    alpha = 1.0;
    if (name === 'radial' && fId) {
      const f = nodes[idIdx.get(fId) ?? -1];
      if (f) {
        f.x = CENTER.x;
        f.y = CENTER.y;
        pinned.set(f.id, { x: CENTER.x, y: CENTER.y });
      }
    }
    if (name === 'cluster') {
      const COMM_X = [0.18, 0.42, 0.66, 0.88, 0.18, 0.42, 0.66];
      const COMM_Y = [0.28, 0.28, 0.28, 0.28, 0.74, 0.74, 0.74];
      nodes.forEach((n) => {
        const c = n.community;
        n.x = W * COMM_X[c % COMM_X.length]! + idJitter(n.id, 1) * 100;
        n.y = H * COMM_Y[c % COMM_Y.length]! + idJitter(n.id, 2) * 100;
      });
    }
    if (name === 'embedding') {
      nodes.forEach((n) => {
        const tHash = ((n.type.charCodeAt(0) * 13 + (n.type.charCodeAt(1) || 0)) % 100) / 100;
        const ang = (n.community / 7) * Math.PI * 2 + tHash * 0.6;
        const rr = 200 + n.score * 250 + (idJitter(n.id, 3) + 0.5) * 60;
        n.x = CENTER.x + Math.cos(ang) * rr * 1.2;
        n.y = CENTER.y + Math.sin(ang) * rr * 0.85;
      });
    }
    if (name === 'hierarchy' && fId) {
      const levels = new Map<string, number>([[fId, 0]]);
      const queue = [fId];
      const adj = buildAdj();
      while (queue.length) {
        const id = queue.shift()!;
        const lv = levels.get(id)!;
        if (lv >= 4) continue;
        for (const nb of adj.get(id) || []) {
          if (!levels.has(nb)) {
            levels.set(nb, lv + 1);
            queue.push(nb);
          }
        }
      }
      const byLevel = new Map<number, string[]>();
      levels.forEach((lv, id) => {
        if (!byLevel.has(lv)) byLevel.set(lv, []);
        byLevel.get(lv)!.push(id);
      });
      byLevel.forEach((ids, lv) => {
        ids.forEach((id, i) => {
          const n = nodes[idIdx.get(id) ?? -1];
          if (!n) return;
          const total = ids.length;
          n.x = W * (0.1 + 0.8 * ((i + 0.5) / total));
          n.y = H * (0.18 + 0.18 * lv);
        });
      });
      nodes.forEach((n) => {
        if (!levels.has(n.id)) {
          n.x = W * (0.05 + (idJitter(n.id, 4) + 0.5) * 0.9);
          n.y = H * 0.92;
        }
      });
    }
  }

  function reseed(): void {
    nodes.forEach((n) => {
      n._tx = n.x;
      n._ty = n.y;
    });
  }

  function tick(): void {
    if (alpha < 0.01) alpha = 0.01;
    const fx = new Float32Array(N);
    const fy = new Float32Array(N);

    if (layout.name === 'force' || layout.name === 'radial') {
      const grid = new Map<string, number[]>();
      nodes.forEach((n, i) => {
        const k = Math.floor(n.x / CELL) + ',' + Math.floor(n.y / CELL);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k)!.push(i);
      });
      for (let i = 0; i < N; i++) {
        const n = nodes[i]!;
        const cx = Math.floor(n.x / CELL);
        const cy = Math.floor(n.y / CELL);
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++) {
            const arr = grid.get(cx + dx + ',' + (cy + dy));
            if (!arr) continue;
            for (const j of arr) {
              if (j <= i) continue;
              const m = nodes[j]!;
              let ddx = n.x - m.x;
              let ddy = n.y - m.y;
              let d2 = ddx * ddx + ddy * ddy;
              if (d2 < 0.01) {
                ddx = Math.random() - 0.5;
                ddy = Math.random() - 0.5;
                d2 = 1;
              }
              if (d2 > 10000) continue;
              const force = 380 / d2;
              const d = Math.sqrt(d2);
              fx[i] = fx[i]! + (ddx / d) * force;
              fy[i] = fy[i]! + (ddy / d) * force;
              fx[j] = fx[j]! - (ddx / d) * force;
              fy[j] = fy[j]! - (ddy / d) * force;
            }
          }
      }

      const REST = 110;
      for (const e of edgeIdx) {
        const a = nodes[e.s]!;
        const b = nodes[e.t]!;
        const ddx = b.x - a.x;
        const ddy = b.y - a.y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy) || 0.01;
        const k = 0.05 * (e.w * 0.6 + 0.4);
        const f = (d - REST) * k;
        fx[e.s] = fx[e.s]! + (ddx / d) * f;
        fy[e.s] = fy[e.s]! + (ddy / d) * f;
        fx[e.t] = fx[e.t]! - (ddx / d) * f;
        fy[e.t] = fy[e.t]! - (ddy / d) * f;
      }

      for (let i = 0; i < N; i++) {
        fx[i] = fx[i]! + (CENTER.x - nodes[i]!.x) * 0.002;
        fy[i] = fy[i]! + (CENTER.y - nodes[i]!.y) * 0.002;
      }

      if (layout.name === 'radial' && layout.focusId) {
        const adj = buildAdj();
        const hops = new Map<string, number>([[layout.focusId, 0]]);
        const q = [layout.focusId];
        while (q.length) {
          const id = q.shift()!;
          const d = hops.get(id)!;
          if (d >= 5) continue;
          for (const nb of adj.get(id) || []) {
            if (!hops.has(nb)) {
              hops.set(nb, d + 1);
              q.push(nb);
            }
          }
        }
        for (let i = 0; i < N; i++) {
          const h = hops.get(nodes[i]!.id);
          if (h == null) continue;
          const targetR = h * 130;
          const dx = nodes[i]!.x - CENTER.x;
          const dy = nodes[i]!.y - CENTER.y;
          const r = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const dr = (targetR - r) * 0.05;
          fx[i] = fx[i]! + (dx / r) * dr;
          fy[i] = fy[i]! + (dy / r) * dr;
        }
      }
    } else {
      for (let i = 0; i < N; i++) {
        const n = nodes[i]!;
        if (n._tx == null) {
          n._tx = n.x;
          n._ty = n.y;
        }
        fx[i] = fx[i]! + (n._tx - n.x) * 0.04;
        fy[i] = fy[i]! + ((n._ty ?? n.y) - n.y) * 0.04;
      }
      for (const e of edgeIdx) {
        const a = nodes[e.s]!;
        const b = nodes[e.t]!;
        const ddx = b.x - a.x;
        const ddy = b.y - a.y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy) || 0.01;
        const f = (d - 60) * 0.01;
        fx[e.s] = fx[e.s]! + (ddx / d) * f;
        fy[e.s] = fy[e.s]! + (ddy / d) * f;
        fx[e.t] = fx[e.t]! - (ddx / d) * f;
        fy[e.t] = fy[e.t]! - (ddy / d) * f;
      }
    }

    const damping = 0.78;
    const speedCap = 18;
    for (let i = 0; i < N; i++) {
      const n = nodes[i]!;
      const p = pinned.get(n.id);
      if (p) {
        n.x = p.x;
        n.y = p.y;
        n.vx = 0;
        n.vy = 0;
        continue;
      }
      n.vx = (n.vx + fx[i]! * alpha) * damping;
      n.vy = (n.vy + fy[i]! * alpha) * damping;
      const sp = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (sp > speedCap) {
        n.vx *= speedCap / sp;
        n.vy *= speedCap / sp;
      }
      n.x += n.vx;
      n.y += n.vy;
    }

    alpha *= 0.992;
    if (alpha < 0.04) alpha = 0.04;
  }

  setLayout(layoutName, focusId);
  reseed();

  return {
    nodes,
    edges,
    tick,
    restart: () => {
      alpha = 1.0;
    },
    setLayout: (name, focus) => {
      setLayout(name, focus);
      reseed();
    },
    pin: (id, x, y) => pinned.set(id, { x, y }),
    unpin: (id) => pinned.delete(id),
    pins: () => pinned,
  };
}
