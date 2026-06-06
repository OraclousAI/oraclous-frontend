// GraphSphere — a Canvas2D knowledge-graph renderer: nodes laid out on a Fibonacci sphere, a
// hand-rolled 3D rotation + perspective projection (no three.js), auto-rotation, radial-gradient
// glow, depth fade/scale + a breathing pulse, drag-to-rotate, and hover/select hit-testing. Ported
// in spirit from the legacy explorer's `view3d` sphere view, adapted to the console's dark surface.
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { GraphNode, GraphEdge } from '@oraclous/api-client';

interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

interface GraphSphereProps {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly selectedId: string | null;
  readonly onSelect: (node: GraphNode | null) => void;
}

const SELECTION = '#10d88a'; // mint — reserved for the live/selection signal
const PALETTE = [
  '#5b8def',
  '#8b5cf6',
  '#e0a458',
  '#2dd4bf',
  '#f472b6',
  '#60a5fa',
  '#a78bfa',
  '#34d399',
  '#fbbf24',
  '#fb7185',
  '#22d3ee',
  '#c084fc',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function typeColor(type: string): string {
  return PALETTE[hashStr(type) % PALETTE.length] ?? '#5b8def';
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function nodeLabel(n: GraphNode): string {
  const p = n.properties as Record<string, unknown>;
  for (const key of ['name', 'title', 'label', 'text']) {
    const v = p[key];
    if (typeof v === 'string' && v.trim() !== '') {
      return v.length > 48 ? `${v.slice(0, 47)}…` : v;
    }
  }
  return n.type;
}

// Deterministic Fibonacci-sphere placement: sort by id-hash for a stable, well-spread layout, then
// distribute over the sphere (golden-angle spiral) with a tiny per-node radial jitter.
function buildPositions(nodes: readonly GraphNode[]): Map<string, Vec3> {
  const m = new Map<string, Vec3>();
  const n = nodes.length || 1;
  const golden = Math.PI * (1 + Math.sqrt(5));
  const indexed = nodes.map((node) => ({ node, h: hashStr(node.id) })).sort((a, b) => a.h - b.h);
  for (let i = 0; i < indexed.length; i++) {
    const item = indexed[i];
    if (!item) continue;
    const { node, h } = item;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = golden * (i + 0.5);
    const jr = 1 + (((h >> 8) % 1000) / 1000 - 0.5) * 0.05;
    m.set(node.id, {
      x: Math.sin(phi) * Math.cos(theta) * jr,
      y: -Math.cos(phi) * jr,
      z: Math.sin(phi) * Math.sin(theta) * jr,
    });
  }
  return m;
}

export function GraphSphere({ nodes, edges, selectedId, onSelect }: GraphSphereProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const positions = useMemo(() => buildPositions(nodes), [nodes]);
  const degree = useMemo(() => {
    const d = new Map<string, number>();
    for (const e of edges) {
      d.set(e.source, (d.get(e.source) ?? 0) + 1);
      d.set(e.target, (d.get(e.target) ?? 0) + 1);
    }
    return d;
  }, [edges]);

  // Mutable state the RAF loop reads — updated each render so the loop never needs re-creating.
  const live = useRef({
    nodes,
    edges,
    positions,
    degree,
    selectedId,
    onSelect,
    rot: { yaw: 0.4, pitch: 0.32 },
    drag: { active: false, moved: false, x: 0, y: 0 },
    hoverId: null as string | null,
    auto: true,
    // projected screen positions for hit-testing, refreshed every frame
    screen: new Map<string, { x: number; y: number; r: number }>(),
  });
  live.current.nodes = nodes;
  live.current.edges = edges;
  live.current.positions = positions;
  live.current.degree = degree;
  live.current.selectedId = selectedId;
  live.current.onSelect = onSelect;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let start = 0;

    const draw = (ts: number) => {
      if (start === 0) start = ts;
      const t = (ts - start) / 1000;
      const s = live.current;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // immersive dark backdrop
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
      bg.addColorStop(0, '#0e1426');
      bg.addColorStop(1, '#070a14');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      if (s.auto && !s.drag.active) s.rot.yaw += 0.0016;
      const { yaw, pitch } = s.rot;
      const cyaw = Math.cos(yaw);
      const syaw = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.36;
      const camZ = R * 3;
      const fMin = camZ / (camZ + R);
      const fMax = camZ / (camZ - R);

      // project every node once; collect for depth-sorted drawing + hit-testing
      const proj = new Map<string, { x: number; y: number; nf: number; z: number }>();
      for (const node of s.nodes) {
        const p = s.positions.get(node.id);
        if (!p) continue;
        const X = p.x * R;
        const Y = p.y * R;
        const Z = p.z * R;
        const x2 = X * cyaw + Z * syaw;
        const z2 = -X * syaw + Z * cyaw;
        const y2 = Y * cp - z2 * sp;
        const z3 = Y * sp + z2 * cp;
        const f = camZ / (camZ + z3);
        const nf = Math.max(0, Math.min(1, (f - fMin) / (fMax - fMin || 1)));
        proj.set(node.id, { x: cx + x2 * f, y: cy + y2 * f, nf, z: z3 });
      }

      // edges first (behind nodes), depth-faded
      ctx.lineWidth = 1;
      for (const e of s.edges) {
        const a = proj.get(e.source);
        const b = proj.get(e.target);
        if (!a || !b) continue;
        const near = (a.nf + b.nf) / 2;
        ctx.strokeStyle = `rgba(150, 170, 210, ${0.05 + near * 0.16})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // nodes back-to-front (farthest = largest z3 drawn first)
      const order = s.nodes.slice().sort((n1, n2) => {
        const z1 = proj.get(n1.id)?.z ?? 0;
        const z2 = proj.get(n2.id)?.z ?? 0;
        return z2 - z1;
      });
      const screen = new Map<string, { x: number; y: number; r: number }>();
      let idx = 0;
      for (const node of order) {
        const pr = proj.get(node.id);
        if (!pr) continue;
        idx++;
        const deg = s.degree.get(node.id) ?? 0;
        const baseR = 3.5 + Math.sqrt(deg + 1) * 1.5;
        const breath = 1 + Math.sin(t * 1.2 + idx * 0.37) * 0.05;
        const r = baseR * (0.65 + pr.nf * 0.7) * breath;
        const isSel = node.id === s.selectedId;
        const isHover = node.id === s.hoverId;
        const color = isSel ? SELECTION : typeColor(node.type);
        const alpha = (0.4 + pr.nf * 0.6) * (isSel || isHover ? 1 : 0.92);
        screen.set(node.id, { x: pr.x, y: pr.y, r });

        // glow
        const glowR = r * (isSel || isHover ? 3.6 : 2.6);
        const glow = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, glowR);
        glow.addColorStop(0, hexToRgba(color, 0.32 * alpha));
        glow.addColorStop(0.5, hexToRgba(color, 0.09 * alpha));
        glow.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(pr.x - glowR, pr.y - glowR, glowR * 2, glowR * 2);

        // core
        const core = ctx.createRadialGradient(pr.x - r * 0.35, pr.y - r * 0.35, 0, pr.x, pr.y, r);
        core.addColorStop(0, hexToRgba(color, alpha));
        core.addColorStop(1, hexToRgba(color, 0.82 * alpha));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, Math.max(0.6, r), 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(7, 10, 20, ${0.7 * alpha})`;
        ctx.stroke();

        // selection pulse ring (mint)
        if (isSel) {
          const pulse = (t * 0.9) % 1;
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, r + 5 + pulse * 16, 0, Math.PI * 2);
          ctx.strokeStyle = hexToRgba(SELECTION, (1 - pulse) * 0.5);
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }
      s.screen = screen;

      // labels for hovered + selected (drawn on top)
      ctx.font = '12px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      for (const id of [s.hoverId, s.selectedId]) {
        if (!id) continue;
        const sc = screen.get(id);
        const node = s.nodes.find((n) => n.id === id);
        if (!sc || !node) continue;
        const label = nodeLabel(node);
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(7, 10, 20, 0.78)';
        ctx.fillRect(sc.x - tw / 2 - 6, sc.y + sc.r + 6, tw + 12, 18);
        ctx.fillStyle = '#f4f4f2';
        ctx.fillText(label, sc.x, sc.y + sc.r + 19);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const nodeAt = (mx: number, my: number): GraphNode | null => {
      const s = live.current;
      let best: { id: string; d: number } | null = null;
      for (const [id, sc] of s.screen) {
        const dx = mx - sc.x;
        const dy = my - sc.y;
        const d = dx * dx + dy * dy;
        const hit = (sc.r + 7) ** 2;
        if (d <= hit && (!best || d < best.d)) best = { id, d };
      }
      return best ? (s.nodes.find((n) => n.id === best!.id) ?? null) : null;
    };

    const onPointerDown = (e: PointerEvent) => {
      const s = live.current;
      s.drag = { active: true, moved: false, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const s = live.current;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (s.drag.active) {
        const dx = e.clientX - s.drag.x;
        const dy = e.clientY - s.drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) s.drag.moved = true;
        s.rot.yaw += dx * 0.006;
        s.rot.pitch = Math.max(-1.2, Math.min(1.2, s.rot.pitch + dy * 0.006));
        s.drag.x = e.clientX;
        s.drag.y = e.clientY;
      } else {
        const hit = nodeAt(mx, my);
        s.hoverId = hit ? hit.id : null;
        canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      const s = live.current;
      const rect = canvas.getBoundingClientRect();
      const wasDrag = s.drag.moved;
      s.drag.active = false;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (!wasDrag) {
        const hit = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
        s.onSelect(hit);
      }
    };

    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  return (
    <div ref={wrapRef} style={styles.wrap}>
      <canvas ref={canvasRef} style={styles.canvas} aria-label="Knowledge graph sphere" />
    </div>
  );
}

const styles = {
  wrap: { position: 'absolute', inset: 0, overflow: 'hidden', touchAction: 'none' },
  canvas: { display: 'block', width: '100%', height: '100%' },
} satisfies Record<string, CSSProperties>;
