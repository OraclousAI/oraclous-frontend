// Graph canvas — Canvas2D for nodes/edges, with a hand-rolled 3D projection,
// a "custom Earth" geo-projection mode, orbit/pan/zoom, hover/select, algorithm
// overlays and a trace-walker animation.
// Ported from legacy-reference/old-frontend src/dash/explorer/ExplorerCanvas.tsx (clone-and-
// refactor, §7). Deliberate changes from legacy: the world atlas is a vendored lazy asset
// instead of a CDN download (CI Gate 1); fonts bind to the brand stack; motion (wobble, breathing,
// pulse rings, auto-rotate) respects prefers-reduced-motion; and a dimmedIds prop carries the
// console's temporal "as of" lens. Type/community colours are graph semantics, not brand
// colours (per the design handoff) — the live-signal accent is the mint token.
// The trace-walker and algorithm-overlay plumbing is kept though nothing drives it yet: the
// Wave-3 ask/chat surface replays retrieval traces through it, and stripping/re-porting the
// renderer twice costs more than carrying the dormant props.
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { OGSim } from './explorerForces.js';
import type { AlgoRun } from './explorerTypes.js';
import {
  CONTINENT_LABELS,
  MAJOR_COUNTRY_IDS,
  loadEarthFeatures,
  type EarthFeature,
} from './explorerGeo.js';

const TYPE_COLORS: Record<string, string> = {
  doc: 'oklch(0.74 0.13 220)',
  person: 'oklch(0.78 0.14 80)',
  concept: 'oklch(0.76 0.14 300)',
  org: 'oklch(0.76 0.13 152)',
  event: 'oklch(0.78 0.15 30)',
  tag: 'oklch(0.62 0.02 240)',
};

// Colour for a node type/label. Real graphs carry open-ended labels ("Event",
// "Organization", "Metric", …) that are not known ahead of time — any label
// not in TYPE_COLORS gets a stable colour hashed from its name.
export function typeColor(type: string | null | undefined): string {
  const key = type || 'Entity';
  if (TYPE_COLORS[key]) return TYPE_COLORS[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `oklch(0.75 0.14 ${h % 360})`;
}
const COMMUNITY_COLOR = (c: number): string => {
  const hues = [198, 268, 30, 152, 348, 88, 220];
  return `oklch(0.74 0.14 ${hues[c % hues.length]})`;
};
const HOP_COLOR = (t: number): string =>
  `oklch(${0.82 - t * 0.18} ${0.16 - t * 0.08} ${200 + t * 30})`;
// The live-signal accent — the mint token (--accent: #10d88a) expressed in oklch; Canvas2D
// cannot resolve CSS custom properties, so the value is pinned here.
const ACCENT = { live: 'oklch(0.783 0.184 159)' };
// Amplitude (screen px) of the gentle per-node "breathing" wobble.
const WOBBLE_PX = 2.8;

export interface CanvasParams {
  stepIndex: number;
}

export interface ExplorerCanvasProps {
  sim: OGSim;
  algoRun: AlgoRun | null;
  focusId: string | null;
  selected: Set<string>;
  onPick: (id: string | null, additive: boolean) => void;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  params: CanvasParams;
  panZoom: { k: number; x: number; y: number };
  setPanZoom: (pz: { k: number; x: number; y: number }) => void;
  onLasso: (ids: string[], additive: boolean) => void;
  onCanvasContext?: (e: { clientX: number; clientY: number }) => void;
  edgeOpacity?: number;
  labelDensity?: 'none' | 'hover' | 'all';
  tick?: boolean;
  visibleIds?: Set<string> | null;
  view3d?: boolean;
  autoRotate?: boolean;
  traceWalker?: string | null;
  traceWalkerPrev?: string | null;
  geoEnabled?: boolean;
  geoAltitude?: number;
  nodeScale?: number;
  // The console's temporal "as of" lens — nodes outside the lens render dimmed.
  dimmedIds?: Set<string> | null;
}

interface Sphere3D {
  X: number;
  Y: number;
  Z: number;
}

export function ExplorerCanvas(props: ExplorerCanvasProps) {
  const {
    sim,
    algoRun,
    focusId,
    selected,
    onPick,
    hoverId,
    onHover,
    params,
    panZoom,
    setPanZoom,
    onLasso,
    onCanvasContext,
    edgeOpacity = 0.55,
    labelDensity = 'hover',
    tick = true,
    visibleIds = null,
    view3d = true,
    autoRotate = false,
    traceWalker = null,
    traceWalkerPrev = null,
    geoEnabled = false,
    geoAltitude = 1.45,
    nodeScale = 1,
    dimmedIds = null,
  } = props;

  const cvsRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    orbit?: boolean;
    pan?: boolean;
    id?: string;
    startX?: number;
    startY?: number;
    yaw?: number;
    pitch?: number;
    ox?: number;
    oy?: number;
    dx?: number;
    dy?: number;
    moved?: boolean;
  } | null>(null);
  const lassoRef = useRef<{
    startX: number;
    startY: number;
    x: number;
    y: number;
    additive: boolean;
  } | null>(null);
  const walkerRef = useRef<{
    from: string | null;
    to: string | null;
    t0: number;
    dur: number;
    visited: Map<string, number>;
  }>({
    from: null,
    to: null,
    t0: 0,
    dur: 900,
    visited: new Map(),
  });
  const traceRotRef = useRef<{
    active: boolean;
    fromYaw?: number;
    fromPitch?: number;
    toYaw?: number;
    toPitch?: number;
    t0?: number;
    dur?: number;
  }>({ active: false });
  const rotRef = useRef({ yaw: 0.5, pitch: 0.25 });
  const autoRotRef = useRef({ enabled: false, last: 0 });
  const drawRef = useRef<() => void>(() => {});
  const labelWidthsRef = useRef(new Map<string, number>());
  const [, force] = useState(0);
  const [cursor, setCursor] = useState('default');

  // Motion is decorative here (wobble, breathing, pulse rings, auto-rotate) — honour the OS
  // setting. The reduceRef mirror lets the rAF draw loop read it without re-subscribing.
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const reduceRef = useRef(reduceMotion);
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      reduceRef.current = mq.matches;
      setReduceMotion(mq.matches);
    };
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!traceWalker) {
      walkerRef.current = { from: null, to: null, t0: 0, dur: 900, visited: new Map() };
      traceRotRef.current = { active: false };
      return;
    }
    const prev = walkerRef.current.to;
    walkerRef.current = {
      from: prev || traceWalkerPrev || traceWalker,
      to: traceWalker,
      t0: performance.now(),
      dur: 1100,
      visited: walkerRef.current.visited,
    };
    walkerRef.current.visited.set(traceWalker, performance.now());
  }, [traceWalker, traceWalkerPrev]);

  useEffect(() => {
    autoRotRef.current.enabled = view3d && autoRotate && !reduceMotion;
    autoRotRef.current.last = performance.now();
  }, [view3d, autoRotate, reduceMotion]);

  // Idle-aware animation loop. It runs only while something actually moves — the sim converging,
  // a camera tween, auto-rotate, a live pointer gesture, or a short post-interaction window for
  // the decorative pulses — then parks (zero CPU until woken). Every render wakes it (cheap), so
  // any prop/state change redraws; pointer handlers wake it directly. Under reduced motion the
  // layout converges in fast-forward instead of animating the drift.
  const runningRef = useRef(false);
  const draggingRef = useRef(false);
  const lastInteractRef = useRef(0);
  const wakeRef = useRef<() => void>(() => {});
  useEffect(() => {
    let disposed = false;
    let raf = 0;
    const DECOR_WINDOW_MS = 2500;
    const loop = () => {
      if (disposed) {
        runningRef.current = false;
        return;
      }
      try {
        if (tick && sim.active()) {
          if (reduceRef.current && !draggingRef.current) {
            // Settle without animating: a burst of ticks per frame until convergence.
            let guard = 0;
            while (sim.active() && guard++ < 40) sim.tick();
          } else {
            sim.tick();
          }
        }
        const traceR = traceRotRef.current;
        if (traceR.active && !dragRef.current?.orbit) {
          const t = Math.min(1, (performance.now() - (traceR.t0 ?? 0)) / (traceR.dur ?? 1));
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          rotRef.current.yaw =
            (traceR.fromYaw ?? 0) + ((traceR.toYaw ?? 0) - (traceR.fromYaw ?? 0)) * ease;
          rotRef.current.pitch =
            (traceR.fromPitch ?? 0) + ((traceR.toPitch ?? 0) - (traceR.fromPitch ?? 0)) * ease;
          if (t >= 1) traceR.active = false;
          autoRotRef.current.last = performance.now();
        } else if (autoRotRef.current.enabled && !dragRef.current?.orbit) {
          const now = performance.now();
          rotRef.current.yaw += (now - autoRotRef.current.last) * 0.00012;
          autoRotRef.current.last = now;
        } else {
          autoRotRef.current.last = performance.now();
        }
        drawRef.current();
        const animating =
          (tick && sim.active()) ||
          traceRotRef.current.active ||
          autoRotRef.current.enabled ||
          draggingRef.current ||
          lassoRef.current !== null ||
          (!reduceRef.current && performance.now() - lastInteractRef.current < DECOR_WINDOW_MS);
        if (animating) {
          raf = requestAnimationFrame(loop);
        } else {
          runningRef.current = false;
        }
      } catch (err) {
        console.error('[explorer draw loop]', err);
        runningRef.current = false;
      }
    };
    const wake = () => {
      lastInteractRef.current = performance.now();
      if (!runningRef.current && !disposed) {
        runningRef.current = true;
        raf = requestAnimationFrame(loop);
      }
    };
    wakeRef.current = wake;
    wake();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      runningRef.current = false;
    };
  }, [sim, tick]);

  // Any render means something the canvas shows may have changed — redraw (and let the
  // decorative pulses run their short window).
  useEffect(() => {
    wakeRef.current();
  });

  useEffect(() => {
    const onR = () => force(Math.random());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  // Deterministic per-node z coordinate, uniform in [-1, 1). The legacy banded z by community,
  // which reads as a sphere only with many communities — real graphs often carry two or three
  // node types, collapsing the cloud into thin slabs (a funnel when rotated). A uniform id-hash
  // fills the ball evenly while staying stable across sims and expands.
  const zMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of sim.nodes) {
      let h = 2166136261;
      for (let k = 0; k < n.id.length; k++) {
        h ^= n.id.charCodeAt(k);
        h = Math.imul(h, 16777619);
      }
      m.set(n.id, ((h >>> 0) % 2000) / 1000 - 1);
    }
    return m;
  }, [sim.nodes]);
  const R_GLOBE = 240;
  // The 3D envelope tracks the layout's actual radius (smoothed per frame in the draw loop), so
  // the whole graph always sits inside the sphere — a fixed radius flattened outliers into a
  // brim. Depth scales with the radius (legacy ratio 420/460) to keep the ball spherical.
  const rMaxRef = useRef(460);

  // Deterministic per-node phase — so each node breathes on its own offset
  // and the graph never moves in lockstep.
  const wobblePhase = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of sim.nodes) {
      let h = 2166136261;
      for (let k = 0; k < n.id.length; k++) {
        h ^= n.id.charCodeAt(k);
        h = Math.imul(h, 16777619);
      }
      m.set(n.id, ((h >>> 0) % 6283) / 1000);
    }
    return m;
  }, [sim.nodes]);

  const latLngTo3D = useCallback((lat: number, lng: number, radius: number): Sphere3D => {
    const phi = (lat * Math.PI) / 180;
    const lam = (lng * Math.PI) / 180;
    return {
      X: radius * Math.cos(phi) * Math.sin(lam),
      Y: -radius * Math.sin(phi),
      Z: -radius * Math.cos(phi) * Math.cos(lam),
    };
  }, []);

  const project3D = useCallback(
    (X: number, Y: number, Z: number) => {
      const cx = 800,
        cy = 500;
      const { yaw, pitch } = rotRef.current;
      const cyaw = Math.cos(yaw),
        syaw = Math.sin(yaw);
      const X2 = X * cyaw + Z * syaw;
      const Z2 = -X * syaw + Z * cyaw;
      const cp = Math.cos(pitch),
        sp = Math.sin(pitch);
      const Y2 = Y * cp - Z2 * sp;
      const Z3 = Y * sp + Z2 * cp;
      const camZ = 1400;
      const denom = camZ + Z3;
      const f = denom > 100 ? camZ / denom : camZ / 100;
      return {
        x: (X2 * f + cx) * panZoom.k + panZoom.x,
        y: (Y2 * f + cy) * panZoom.k + panZoom.y,
        depth: Math.max(0, Math.min(1, (Z3 + 500) / 1000)),
        scale: Math.max(0.2, Math.min(3, f)),
        z3: Z3,
      };
    },
    [panZoom]
  );

  const geoDropT = useMemo(() => {
    if (!geoEnabled) return 0;
    const lo = 1.1,
      hi = 2.4;
    return Math.max(0, Math.min(1, (panZoom.k - lo) / (hi - lo)));
  }, [geoEnabled, panZoom.k]);

  const sphereShell = useMemo(() => {
    // Only the geo "Earth" mode uses fixed sphere / lat-long placement. Plain
    // 3D is force-driven, so dragging a node reshapes the whole graph.
    if (!view3d || !geoEnabled) return null;
    const m = new Map<string, Sphere3D>();
    const baseR = geoEnabled ? R_GLOBE * geoAltitude : 420;
    const surfR = R_GLOBE * 1.005;
    const geoR = geoEnabled ? baseR + (surfR - baseR) * geoDropT : baseR;
    const outerR = geoEnabled ? baseR * 1.45 : baseR;
    const nonGeo: typeof sim.nodes = [];
    for (const n of sim.nodes) {
      if (geoEnabled && n.geo) {
        m.set(n.id, latLngTo3D(n.geo.lat, n.geo.lng, geoR));
      } else {
        nonGeo.push(n);
      }
    }
    const N = nonGeo.length || 1;
    const golden = Math.PI * (1 + Math.sqrt(5));
    const indexed = nonGeo.map((n) => {
      let h = 0;
      for (let k = 0; k < n.id.length; k++) h = (h * 31 + n.id.charCodeAt(k)) >>> 0;
      return { n, h };
    });
    indexed.sort((a, b) => a.h - b.h);
    for (let i = 0; i < indexed.length; i++) {
      const { n, h } = indexed[i]!;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
      const theta = golden * (i + 0.5);
      const jr = 1 + (((h >> 8) % 1000) / 1000 - 0.5) * 0.04;
      const r = outerR * jr;
      m.set(n.id, {
        X: r * Math.sin(phi) * Math.cos(theta),
        Y: -r * Math.cos(phi),
        Z: r * Math.sin(phi) * Math.sin(theta),
      });
    }
    return m;
  }, [view3d, geoEnabled, geoAltitude, geoDropT, sim.nodes, latLngTo3D]);

  useEffect(() => {
    if (!view3d || !traceWalker || !sphereShell?.has(traceWalker)) {
      traceRotRef.current = { active: false };
      return;
    }
    const pTo = sphereShell.get(traceWalker)!;
    const fromId = walkerRef.current.from;
    const pFrom = fromId && sphereShell.has(fromId) ? sphereShell.get(fromId)! : null;
    const mx = pFrom ? (pFrom.X + pTo.X) / 2 : pTo.X;
    const my = pFrom ? (pFrom.Y + pTo.Y) / 2 : pTo.Y;
    const mz = pFrom ? (pFrom.Z + pTo.Z) / 2 : pTo.Z;
    const horiz = Math.hypot(mx, mz) || 1;
    let toYaw = Math.atan2(mx, -mz);
    const cur = rotRef.current.yaw;
    let d = toYaw - cur;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    toYaw = cur + d;
    const rawPitch = Math.atan2(-my, horiz);
    const toPitch = Math.max(-1.0, Math.min(1.0, rawPitch * 0.55));
    traceRotRef.current = {
      active: true,
      fromYaw: cur,
      fromPitch: rotRef.current.pitch,
      toYaw,
      toPitch,
      t0: performance.now(),
      dur: 1100,
    };
  }, [traceWalker, view3d, sphereShell]);

  // Country borders, loaded once on demand from the vendored atlas (lazy JSON chunk).
  const [earthData, setEarthData] = useState<{ features: EarthFeature[] } | null>(null);
  useEffect(() => {
    if (!geoEnabled || earthData) return;
    let cancelled = false;
    void loadEarthFeatures().then((data) => {
      if (!cancelled && data) setEarthData(data);
    });
    return () => {
      cancelled = true;
    };
  }, [geoEnabled, earthData]);

  const edgeIdx = useMemo(() => new Map(sim.nodes.map((n, i) => [n.id, i])), [sim.nodes]);

  const screen = useCallback(
    (wx: number, wy: number, id?: string) => {
      // Gentle "breathing" wobble — a settled graph still feels alive (Neo4j-like).
      let wobX = 0,
        wobY = 0;
      if (id && !reduceRef.current) {
        const ph = wobblePhase.get(id) ?? 0;
        const t = performance.now() / 1000;
        wobX = Math.sin(t * 0.9 + ph) * WOBBLE_PX;
        wobY = Math.cos(t * 0.72 + ph * 1.7) * WOBBLE_PX;
      }
      if (id && sphereShell && sphereShell.has(id)) {
        const p = sphereShell.get(id)!;
        const s = project3D(p.X, p.Y, p.Z);
        return { ...s, x: s.x + wobX, y: s.y + wobY };
      }
      if (!view3d) {
        const z = zMap.get(id || '') ?? 0;
        const zoomDepth = panZoom.k;
        const scale = 1 + z * 0.18 * Math.min(2, zoomDepth);
        const cx = wrapRef.current ? wrapRef.current.clientWidth / 2 : 800;
        const cy = wrapRef.current ? wrapRef.current.clientHeight / 2 : 500;
        const baseX = wx * panZoom.k + panZoom.x;
        const baseY = wy * panZoom.k + panZoom.y;
        const px = baseX + (baseX - cx) * z * 0.08 * Math.max(0, zoomDepth - 1);
        const py = baseY + (baseY - cy) * z * 0.08 * Math.max(0, zoomDepth - 1);
        return { x: px + wobX, y: py + wobY, depth: 0.5 + z * 0.5, scale, z3: 0 };
      }
      const cx = 800,
        cy = 500;
      const X = wx - cx,
        Y = wy - cy;
      const dx = wx - cx,
        dy = wy - cy;
      const rXY = Math.sqrt(dx * dx + dy * dy);
      const R_MAX = rMaxRef.current;
      const envelope = Math.sqrt(Math.max(0, 1 - Math.min(1, (rXY / R_MAX) ** 2)));
      const Z = (zMap.get(id || '') ?? 0) * R_MAX * 0.91 * envelope;
      const { yaw, pitch } = rotRef.current;
      const cyaw = Math.cos(yaw),
        syaw = Math.sin(yaw);
      const X2 = X * cyaw + Z * syaw;
      const Z2 = -X * syaw + Z * cyaw;
      const cp = Math.cos(pitch),
        sp = Math.sin(pitch);
      const Y2 = Y * cp - Z2 * sp;
      const Z3 = Y * sp + Z2 * cp;
      const camZ = 1400;
      const denom = camZ + Z3;
      const f = denom > 100 ? camZ / denom : camZ / 100;
      return {
        x: (X2 * f + cx) * panZoom.k + panZoom.x + wobX,
        y: (Y2 * f + cy) * panZoom.k + panZoom.y + wobY,
        depth: Math.max(0, Math.min(1, (Z3 + 500) / 1000)),
        scale: Math.max(0.2, Math.min(3, f)),
        z3: Z3,
      };
    },
    [view3d, panZoom, zMap, sphereShell, project3D, wobblePhase]
  );

  const screenToWorld = useCallback(
    (sx: number, sy: number, id: string) => {
      const cx = 800,
        cy = 500;
      if (!view3d) {
        return { x: (sx - panZoom.x) / panZoom.k, y: (sy - panZoom.y) / panZoom.k };
      }
      const n = sim.nodes.find((nn) => nn.id === id);
      const wx0 = n ? n.x : cx,
        wy0 = n ? n.y : cy;
      const dxe = wx0 - cx,
        dye = wy0 - cy;
      const rXY = Math.sqrt(dxe * dxe + dye * dye);
      const R_MAX = rMaxRef.current;
      const envelope = Math.sqrt(Math.max(0, 1 - Math.min(1, (rXY / R_MAX) ** 2)));
      const Z = (zMap.get(id) ?? 0) * R_MAX * 0.91 * envelope;
      const { yaw, pitch } = rotRef.current;
      const cyaw = Math.cos(yaw),
        syaw = Math.sin(yaw);
      const cp = Math.cos(pitch),
        sp = Math.sin(pitch);
      const sp0 = screen(wx0, wy0, id);
      const f = sp0.scale || 1;
      const X2 = (sx - panZoom.x) / panZoom.k - cx;
      const Y2 = (sy - panZoom.y) / panZoom.k - cy;
      const X2u = X2 / f;
      const Y2u = Y2 / f;
      let X: number, Y: number;
      if (Math.abs(cyaw) > 0.15) {
        X = (X2u - Z * syaw) / cyaw;
        const Z2 = -X * syaw + Z * cyaw;
        Y = (Y2u + Z2 * sp) / cp;
      } else {
        X = wx0 - cx;
        const Z2 = -X * syaw + Z * cyaw;
        Y = (Y2u + Z2 * sp) / cp;
      }
      return { x: X + cx, y: Y + cy };
    },
    [view3d, panZoom, zMap, sim.nodes, screen]
  );

  const nodeRadius = useCallback(
    (n: { degree: number; score?: number }, style?: { sizeBoost?: number; big?: boolean }) => {
      let r = 4 + Math.sqrt(n.degree + 1) * 1.4 + (n.score || 0) * 4;
      if (style?.sizeBoost) r += style.sizeBoost * 8;
      if (style?.big) r += 3;
      const dropShrink = 1 - geoDropT * 0.45;
      return r * nodeScale * dropShrink;
    },
    [geoDropT, nodeScale]
  );
  const zoomSize = useCallback(() => Math.pow(panZoom.k, 0.65), [panZoom.k]);

  const draw = useCallback(() => {
    const cvs = cvsRef.current;
    const wrap = wrapRef.current;
    if (!cvs || !wrap) return;
    const w = wrap.clientWidth,
      h = wrap.clientHeight;
    if (cvs.width !== w * devicePixelRatio || cvs.height !== h * devicePixelRatio) {
      cvs.width = w * devicePixelRatio;
      cvs.height = h * devicePixelRatio;
      cvs.style.width = w + 'px';
      cvs.style.height = h + 'px';
    }
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Track the layout's radius (force layouts breathe) with a smoothed follow, floor 460.
    if (view3d && !geoEnabled) {
      let maxR2 = 0;
      for (const n of sim.nodes) {
        const ddx = n.x - 800;
        const ddy = n.y - 500;
        const r2 = ddx * ddx + ddy * ddy;
        if (r2 > maxR2) maxR2 = r2;
      }
      const target = Math.max(460, Math.sqrt(maxR2) * 1.04);
      rMaxRef.current += (target - rMaxRef.current) * 0.08;
    }

    // Earth (geo mode)
    if (geoEnabled) {
      const segs = 48;
      const latLines = [-60, -30, 0, 30, 60];
      const lngLines: number[] = [];
      for (let i = 0; i < 12; i++) lngLines.push(i * 30 - 180);

      const center = project3D(0, 0, 0);
      const equatorRight = project3D(R_GLOBE, 0, 0);
      const apparentR = Math.hypot(equatorRight.x - center.x, equatorRight.y - center.y);
      const halo = ctx.createRadialGradient(
        center.x,
        center.y,
        apparentR * 0.95,
        center.x,
        center.y,
        apparentR * 1.18
      );
      halo.addColorStop(0, 'oklch(0.7 0.12 220 / 0.22)');
      halo.addColorStop(1, 'oklch(0.7 0.12 220 / 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(center.x, center.y, apparentR * 1.2, 0, Math.PI * 2);
      ctx.fill();
      const ocean = ctx.createRadialGradient(
        center.x - apparentR * 0.35,
        center.y - apparentR * 0.35,
        0,
        center.x,
        center.y,
        apparentR
      );
      ocean.addColorStop(0, 'oklch(0.34 0.06 235 / 0.92)');
      ocean.addColorStop(0.55, 'oklch(0.24 0.05 235 / 0.92)');
      ocean.addColorStop(0.95, 'oklch(0.14 0.04 235 / 0.92)');
      ocean.addColorStop(1, 'oklch(0.10 0.03 235 / 0.85)');
      ctx.fillStyle = ocean;
      ctx.beginPath();
      ctx.arc(center.x, center.y, apparentR, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 0.8;
      const drawArc = (pts: { x: number; y: number; z3: number }[], alphaFront: number) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i]!,
            b = pts[i + 1]!;
          if ((a.z3 + b.z3) / 2 > 0) continue;
          ctx.strokeStyle = `oklch(0.78 0.06 220 / ${alphaFront})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      };
      for (const lat of latLines) {
        const pts = [];
        for (let i = 0; i <= segs; i++) {
          const lng = -180 + (360 * i) / segs;
          const p = latLngTo3D(lat, lng, R_GLOBE * 1.001);
          pts.push(project3D(p.X, p.Y, p.Z));
        }
        drawArc(pts, lat === 0 ? 0.32 : 0.14);
      }
      for (const lng of lngLines) {
        const pts = [];
        for (let i = 0; i <= segs; i++) {
          const lat = -85 + (170 * i) / segs;
          const p = latLngTo3D(lat, lng, R_GLOBE * 1.001);
          pts.push(project3D(p.X, p.Y, p.Z));
        }
        drawArc(pts, 0.13);
      }

      if (earthData) {
        const R_SURF = R_GLOBE * 1.002;
        ctx.fillStyle = 'oklch(0.42 0.07 145 / 0.82)';
        for (const feat of earthData.features) {
          for (const ring of feat.rings) {
            let sumZ = 0,
              nn = 0;
            for (let i = 0; i < ring.length; i += 4) {
              const [lng, lat] = ring[i]!;
              const p = latLngTo3D(lat, lng, R_SURF);
              sumZ += project3D(p.X, p.Y, p.Z).z3;
              nn++;
            }
            if (nn === 0 || sumZ / nn > 10) continue;
            ctx.beginPath();
            let started = false;
            for (let i = 0; i < ring.length; i++) {
              const [lng, lat] = ring[i]!;
              const p = latLngTo3D(lat, lng, R_SURF);
              const s = project3D(p.X, p.Y, p.Z);
              if (s.z3 > 30) {
                started = false;
                continue;
              }
              if (!started) {
                ctx.moveTo(s.x, s.y);
                started = true;
              } else ctx.lineTo(s.x, s.y);
            }
            ctx.fill();
          }
        }
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = 'oklch(0.86 0.05 145 / 0.55)';
        for (const feat of earthData.features) {
          for (const ring of feat.rings) {
            for (let i = 0; i < ring.length - 1; i++) {
              const [lng1, lat1] = ring[i]!;
              const [lng2, lat2] = ring[i + 1]!;
              const p1 = latLngTo3D(lat1, lng1, R_SURF);
              const p2 = latLngTo3D(lat2, lng2, R_SURF);
              const s1 = project3D(p1.X, p1.Y, p1.Z);
              const s2 = project3D(p2.X, p2.Y, p2.Z);
              if ((s1.z3 + s2.z3) / 2 > 0) continue;
              ctx.beginPath();
              ctx.moveTo(s1.x, s1.y);
              ctx.lineTo(s2.x, s2.y);
              ctx.stroke();
            }
          }
        }

        const k = panZoom.k;
        const placed: { x: number; y: number; w: number; h: number }[] = [];
        const tryPlace = (
          text: string,
          lat: number,
          lng: number,
          fontPx: number,
          color: string,
          weight = 500
        ) => {
          const p = latLngTo3D(lat, lng, R_SURF * 1.01);
          const s = project3D(p.X, p.Y, p.Z);
          if (s.z3 > -5) return;
          ctx.font = `${weight} ${fontPx}px Sora, ui-sans-serif, system-ui, sans-serif`;
          const m = ctx.measureText(text);
          const tw = m.width + 4,
            th = fontPx + 2;
          const bx = s.x - tw / 2,
            by = s.y - th / 2;
          for (const r of placed) {
            if (bx < r.x + r.w && bx + tw > r.x && by < r.y + r.h && by + th > r.y) return;
          }
          placed.push({ x: bx, y: by, w: tw, h: th });
          const alpha = Math.max(0.4, Math.min(1, -s.z3 / (R_GLOBE * 0.85)));
          ctx.fillStyle = color.replace(/[\d.]+\)$/, `${alpha.toFixed(2)})`);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, s.x, s.y);
        };
        for (const cl of CONTINENT_LABELS) {
          const fontPx = Math.max(11, Math.min(20, 14 + (1 - Math.min(k, 1)) * 4));
          tryPlace(cl.name.toUpperCase(), cl.lat, cl.lng, fontPx, 'oklch(0.92 0.04 220 / 1)', 600);
        }
        if (k > 0.55) {
          const sorted = [...earthData.features].sort((a, b) => b.size - a.size);
          for (const feat of sorted) {
            if (!feat.name || !feat.centroid) continue;
            const isMajor = MAJOR_COUNTRY_IDS.has(Number(feat.id));
            if (k < 1.1 && !isMajor) continue;
            const fontPx = isMajor
              ? Math.max(9, Math.min(13, 9 + k * 2.5))
              : Math.max(8, Math.min(11, 7 + k * 2));
            tryPlace(
              feat.name,
              feat.centroid[0],
              feat.centroid[1],
              fontPx,
              isMajor ? 'oklch(0.88 0.03 220 / 1)' : 'oklch(0.78 0.02 220 / 1)',
              isMajor ? 500 : 400
            );
          }
        }
      }

      for (const n of sim.nodes) {
        if (!n.geo) continue;
        if (visibleIds && !visibleIds.has(n.id)) continue;
        const surf = latLngTo3D(n.geo.lat, n.geo.lng, R_GLOBE * 1.005);
        const ps = project3D(surf.X, surf.Y, surf.Z);
        if (ps.z3 > 20) continue;
        const np = screen(n.x, n.y, n.id);
        ctx.strokeStyle = `oklch(0.74 0.10 220 / ${0.22 + (1 - ps.depth) * 0.3})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(ps.x, ps.y);
        ctx.lineTo(np.x, np.y);
        ctx.stroke();
        ctx.fillStyle = `oklch(0.88 0.12 220 / ${0.6 + (1 - ps.depth) * 0.3})`;
        ctx.beginPath();
        ctx.arc(ps.x, ps.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const T = performance.now() / 1000;
    // Per-node radial-gradient glows are the renderer's hottest allocation — past a few hundred
    // nodes they cost more than they show. The core fills and rings stay.
    const drawGlow = sim.nodes.length <= 300;
    const nodeStyle = algoRun?.nodeStyle || new Map();
    const edgeStyle = algoRun?.edgeStyle || new Map();
    const stepHL = algoRun?.steps?.[params.stepIndex || 0];
    const hlNodes = stepHL?.highlightNodes;
    const hlEdges = stepHL?.highlightEdges;

    let selNeighbors: Set<string> | null = null;
    if (selected && selected.size > 0 && !algoRun) {
      selNeighbors = new Set(selected);
      for (const e of sim.edges) {
        if (selected.has(e.source)) selNeighbors.add(e.target);
        else if (selected.has(e.target)) selNeighbors.add(e.source);
      }
    }

    // Edges
    ctx.lineWidth = 1;
    const viewW = cvs.clientWidth || 1600;
    const viewH = cvs.clientHeight || 1000;
    const cullEdges = geoDropT > 0.5;
    for (const e of sim.edges) {
      if (visibleIds && (!visibleIds.has(e.source) || !visibleIds.has(e.target))) continue;
      const a = sim.nodes[edgeIdx.get(e.source) ?? -1];
      const b = sim.nodes[edgeIdx.get(e.target) ?? -1];
      if (!a || !b) continue;
      const sa = screen(a.x, a.y, a.id),
        sb = screen(b.x, b.y, b.id);
      if (cullEdges) {
        const aIn = sa.x >= -50 && sa.x <= viewW + 50 && sa.y >= -50 && sa.y <= viewH + 50;
        const bIn = sb.x >= -50 && sb.x <= viewW + 50 && sb.y >= -50 && sb.y <= viewH + 50;
        if (!aIn && !bIn) continue;
      }
      const es = edgeStyle.get(e.id);
      const isHL = hlEdges?.has(e.id);
      const dim =
        es?.dim || (algoRun && !isHL && (hlEdges?.size ?? 0) > 0 && algoRun.steps.length > 1);
      const edgeDepth = ((sa.depth ?? 0.5) + (sb.depth ?? 0.5)) / 2;
      const depthBoost = view3d ? 1 : 0.55 + edgeDepth * 0.9;
      if (es?.accent === 'amber') {
        ctx.strokeStyle = 'oklch(0.82 0.16 70 / 0.85)';
        ctx.lineWidth = (es?.width || 2.4) * depthBoost;
      } else if (isHL) {
        ctx.strokeStyle = 'oklch(0.783 0.184 159 / 0.85)';
        ctx.lineWidth = 2 * depthBoost;
      } else {
        const dropBoost = 1 + geoDropT * 1.4;
        const op = (dim ? edgeOpacity * 0.18 : edgeOpacity * 0.55) * depthBoost * dropBoost;
        ctx.strokeStyle = `oklch(0.78 0.02 240 / ${Math.min(1, op)})`;
        ctx.lineWidth = Math.max(0.5, depthBoost);
      }
      ctx.beginPath();
      ctx.moveTo(sa.x, sa.y);
      ctx.lineTo(sb.x, sb.y);
      ctx.stroke();
    }

    // Nodes — depth-sorted in 3D
    const nodeOrder = view3d
      ? sim.nodes
          .map((n, i) => ({ n, i, d: screen(n.x, n.y, n.id).depth }))
          .sort((a, b) => b.d - a.d)
      : sim.nodes.map((n, i) => ({ n, i, d: 0.5 }));
    let nodeIdx = 0;
    for (const item of nodeOrder) {
      const n = item.n;
      nodeIdx++;
      if (visibleIds && !visibleIds.has(n.id)) continue;
      const sp = screen(n.x, n.y, n.id);
      const depthFade = view3d ? 1 - sp.depth * 0.55 : 1;
      const depthScale = view3d ? 0.55 + sp.scale * 0.6 : 1;
      const st = nodeStyle.get(n.id);
      const phase = (nodeIdx * 0.37) % (Math.PI * 2);
      const breath = reduceRef.current ? 1 : 1 + Math.sin(T * 1.2 + phase) * 0.04;
      const r = nodeRadius(n, st) * zoomSize() * breath * depthScale;
      const isHL = hlNodes ? hlNodes.has(n.id) : true;
      const inSelNbrhood = selNeighbors ? selNeighbors.has(n.id) : true;
      const dim =
        st?.dim ||
        (algoRun && !isHL) ||
        (selNeighbors && !inSelNbrhood) ||
        (dimmedIds !== null && dimmedIds.has(n.id));

      let fill: string;
      if (st?.hopColor != null) fill = HOP_COLOR(st.hopColor);
      else if (st?.community != null) fill = COMMUNITY_COLOR(st.community);
      else if (st?.score != null) {
        const t = Math.min(1, st.score * 1.4);
        fill = `oklch(${0.5 + t * 0.32} ${0.16 - t * 0.04} ${320 - t * 40})`;
      } else fill = typeColor(n.type);

      const prevAlpha = ctx.globalAlpha;
      const nonGeoFade = geoEnabled && !n.geo ? Math.max(0.05, 1 - geoDropT) : 1;
      const fadeMul = (view3d && !dim ? depthFade : 1) * nonGeoFade;
      ctx.globalAlpha = prevAlpha * fadeMul;

      if (!dim && drawGlow) {
        const glowR = r * (view3d ? 2.6 : 3.0);
        const grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, glowR);
        grad.addColorStop(0, fill.replace(')', ' / 0.28)'));
        grad.addColorStop(0.5, fill.replace(')', ' / 0.08)'));
        grad.addColorStop(1, fill.replace(')', ' / 0)'));
        ctx.fillStyle = grad;
        ctx.fillRect(sp.x - glowR, sp.y - glowR, glowR * 2, glowR * 2);
      }
      if (st?.ring && !dim) {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = fill.replace(')', ' / 0.18)');
        ctx.fill();
      }
      if (!dim) {
        const cg = ctx.createRadialGradient(sp.x - r * 0.35, sp.y - r * 0.35, 0, sp.x, sp.y, r);
        cg.addColorStop(0, fill.replace(')', ' / 1)'));
        cg.addColorStop(1, fill.replace(')', ' / 0.86)'));
        ctx.fillStyle = cg;
      } else {
        ctx.fillStyle = 'oklch(0.45 0.01 240 / 0.42)';
      }
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = dim ? 'transparent' : 'oklch(0.18 0.01 240 / 0.7)';
      ctx.stroke();
      ctx.globalAlpha = prevAlpha;

      if (selected.has(n.id)) {
        if (!reduceRef.current) {
          const pulse = (T * 0.9) % 1;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, r + 5 + pulse * 18, 0, Math.PI * 2);
          ctx.strokeStyle = `oklch(0.783 0.184 159 / ${(1 - pulse) * 0.45})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(
          sp.x,
          sp.y,
          r + 5 + (reduceRef.current ? 0 : Math.sin(T * 2.5) * 0.6),
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = ACCENT.live;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      if (n.id === focusId) {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r + 9, 0, Math.PI * 2);
        ctx.strokeStyle = ACCENT.live;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (n.id === hoverId) {
        if (!reduceRef.current) {
          const hp = (T * 1.4) % 1;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, r + 3 + hp * 12, 0, Math.PI * 2);
          ctx.strokeStyle = `oklch(0.96 0 0 / ${(1 - hp) * 0.55})`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'oklch(0.95 0 0 / 0.7)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // Labels — measureText is cached per label (the font never changes).
    ctx.font = '11px Sora, ui-sans-serif, system-ui';
    const widths = labelWidthsRef.current;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (const n of sim.nodes) {
      if (visibleIds && !visibleIds.has(n.id)) continue;
      const sp = screen(n.x, n.y, n.id);
      const st = nodeStyle.get(n.id);
      const isHL = hlNodes ? hlNodes.has(n.id) : true;
      const dim = st?.dim || (algoRun && !isHL) || (dimmedIds !== null && dimmedIds.has(n.id));
      const r = nodeRadius(n, st) * zoomSize();
      const degreeThreshold = Math.max(0, 14 - panZoom.k * 8);
      let show = false;
      if (labelDensity === 'all' && !dim && n.degree >= degreeThreshold) show = true;
      if (labelDensity === 'hover') {
        if (n.id === hoverId || n.id === focusId || selected.has(n.id)) show = true;
        else if (panZoom.k > 1.4 && n.degree >= degreeThreshold + 2 && !dim) show = true;
      }
      if (st?.big || (st?.sizeBoost && st.sizeBoost > 0.5)) show = true;
      if (!show) continue;
      const sp2depth = view3d ? 1 : (zMap.get(n.id) ?? 0) * 0.5 + 0.5;
      const labelAlpha = 0.55 + sp2depth * 0.4;
      const text = n.name;
      const padX = 5;
      let tw = widths.get(text);
      if (tw === undefined) {
        tw = ctx.measureText(text).width;
        widths.set(text, tw);
      }
      const x = sp.x + r + 6;
      const y = sp.y;
      ctx.fillStyle = `oklch(0.18 0.01 240 / ${(0.78 * labelAlpha).toFixed(2)})`;
      ctx.fillRect(x - padX, y - 8, tw + padX * 2, 16);
      ctx.fillStyle = `oklch(0.92 0.005 240 / ${labelAlpha.toFixed(2)})`;
      ctx.fillText(text, x, y);
    }

    // Trace walker
    if (traceWalker) {
      const walker = walkerRef.current;
      const findN = (id: string) => sim.nodes[edgeIdx.get(id) ?? -1];
      const aN = walker.from ? findN(walker.from) : null;
      const bN = walker.to ? findN(walker.to) : null;
      const now = performance.now();
      for (const [id, t0] of walker.visited) {
        const n = findN(id);
        if (!n) continue;
        const age = (now - t0) / 1400;
        if (age > 1) continue;
        const sp = screen(n.x, n.y, n.id);
        const rr = 6 + age * 28;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `oklch(0.86 0.18 200 / ${(1 - age) * 0.55})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      if (aN && bN) {
        const dt = Math.min(1, (now - walker.t0) / walker.dur);
        const ease = dt < 0.5 ? 2 * dt * dt : 1 - Math.pow(-2 * dt + 2, 2) / 2;
        const aP = view3d && sphereShell?.has(aN.id) ? sphereShell.get(aN.id)! : null;
        const bP = view3d && sphereShell?.has(bN.id) ? sphereShell.get(bN.id)! : null;
        const arcPoint = (t: number): { x: number; y: number } => {
          if (aP && bP) {
            const aLen = Math.hypot(aP.X, aP.Y, aP.Z) || 1;
            const bLen = Math.hypot(bP.X, bP.Y, bP.Z) || 1;
            const ax = aP.X / aLen,
              ay = aP.Y / aLen,
              az = aP.Z / aLen;
            const bx = bP.X / bLen,
              by = bP.Y / bLen,
              bz = bP.Z / bLen;
            let dot = ax * bx + ay * by + az * bz;
            dot = Math.max(-1, Math.min(1, dot));
            const omega = Math.acos(dot);
            let s0: number, s1: number;
            if (omega < 1e-3) {
              s0 = 1 - t;
              s1 = t;
            } else {
              const so = Math.sin(omega);
              s0 = Math.sin((1 - t) * omega) / so;
              s1 = Math.sin(t * omega) / so;
            }
            const dx = ax * s0 + bx * s1;
            const dy = ay * s0 + by * s1;
            const dz = az * s0 + bz * s1;
            const dl = Math.hypot(dx, dy, dz) || 1;
            const mag = aLen + (bLen - aLen) * t + Math.sin(t * Math.PI) * 36;
            const proj = project3D((dx / dl) * mag, (dy / dl) * mag, (dz / dl) * mag);
            const spA = project3D(aP.X, aP.Y, aP.Z);
            const spB = project3D(bP.X, bP.Y, bP.Z);
            const ex = spB.x - spA.x,
              ey = spB.y - spA.y;
            const len2d = Math.hypot(ex, ey) || 1;
            const nx = -ey / len2d,
              ny = ex / len2d;
            const lift = Math.min(110, len2d * 0.22) * Math.sin(t * Math.PI);
            const sgn = ny < 0 ? 1 : -1;
            return { x: proj.x + nx * lift * sgn, y: proj.y + ny * lift * sgn };
          }
          const spA = screen(aN.x, aN.y, aN.id);
          const spB = screen(bN.x, bN.y, bN.id);
          const mx = (spA.x + spB.x) / 2;
          const my = (spA.y + spB.y) / 2;
          const ex = spB.x - spA.x,
            ey = spB.y - spA.y;
          const len = Math.hypot(ex, ey) || 1;
          const nx = -ey / len,
            ny = ex / len;
          const lift = Math.min(120, len * 0.25);
          const cx = mx + nx * lift * (ny < 0 ? 1 : -1);
          const cy = my + ny * lift * (ny < 0 ? 1 : -1);
          const u = 1 - t;
          return {
            x: u * u * spA.x + 2 * u * t * cx + t * t * spB.x,
            y: u * u * spA.y + 2 * u * t * cy + t * t * spB.y,
          };
        };
        const SEG = 28;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i <= SEG; i++) {
          const t = i / SEG;
          if (t < ease) continue;
          const p = arcPoint(t);
          if (i === 0 || t === ease) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'oklch(0.78 0.14 200 / 0.18)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= SEG; i++) {
          const t = (i / SEG) * ease;
          const p = arcPoint(t);
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'oklch(0.85 0.18 200 / 0.55)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        for (let k = 6; k >= 1; k--) {
          const t2 = Math.max(0, ease - k * 0.05);
          const p = arcPoint(t2);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6 - k * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `oklch(0.88 0.18 200 / ${0.35 - k * 0.04})`;
          ctx.fill();
        }
        const head = arcPoint(ease);
        const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 26);
        glow.addColorStop(0, 'oklch(0.92 0.18 200 / 0.85)');
        glow.addColorStop(0.5, 'oklch(0.85 0.18 200 / 0.25)');
        glow.addColorStop(1, 'oklch(0.85 0.18 200 / 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(head.x - 26, head.y - 26, 52, 52);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = 'oklch(0.96 0.10 200)';
        ctx.fill();
        ctx.strokeStyle = 'oklch(0.55 0.18 200)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else if (bN) {
        const sp = screen(bN.x, bN.y, bN.id);
        const t = ((now - walker.t0) / 800) % 1;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 6 + t * 22, 0, Math.PI * 2);
        ctx.strokeStyle = `oklch(0.92 0.18 200 / ${(1 - t) * 0.7})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }

    if (!view3d && panZoom.k > 0.9) {
      const vignetteStrength = Math.min(0.55, (panZoom.k - 0.9) * 0.35);
      const vg = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.25,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.7
      );
      vg.addColorStop(0, 'oklch(0.16 0.008 240 / 0)');
      vg.addColorStop(1, `oklch(0.12 0.008 240 / ${vignetteStrength.toFixed(2)})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    }
  }, [
    sim,
    algoRun,
    params,
    panZoom,
    geoEnabled,
    geoDropT,
    earthData,
    edgeOpacity,
    labelDensity,
    view3d,
    visibleIds,
    selected,
    hoverId,
    focusId,
    traceWalker,
    sphereShell,
    edgeIdx,
    screen,
    project3D,
    latLngTo3D,
    nodeRadius,
    zoomSize,
    zMap,
    dimmedIds,
  ]);

  drawRef.current = draw;

  const findHit = (sx: number, sy: number) => {
    let best: (typeof sim.nodes)[number] | null = null;
    let bestD = Infinity;
    for (const n of sim.nodes) {
      if (visibleIds && !visibleIds.has(n.id)) continue;
      const sp = screen(n.x, n.y, n.id);
      const dx = sp.x - sx,
        dy = sp.y - sy;
      const d2 = dx * dx + dy * dy;
      const r =
        (4 + Math.sqrt(n.degree + 1) * 1.4 + (n.score || 0) * 4 + 4) * (sp.scale || 1) * panZoom.k;
      if (d2 < r * r && d2 < bestD) {
        best = n;
        bestD = d2;
      }
    }
    return best;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    wakeRef.current();
    const rect = wrapRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left,
      sy = e.clientY - rect.top;
    const hit = findHit(sx, sy);

    // Shift / Alt drag → lasso select.
    if (e.shiftKey || e.altKey) {
      lassoRef.current = { startX: sx, startY: sy, x: sx, y: sy, additive: e.shiftKey };
      wrapRef.current!.setPointerCapture(e.pointerId);
      return;
    }

    // Node → select it and start a node drag. This takes priority over orbit,
    // so picking or dragging a node never rotates the camera (Neo4j-style):
    // dragging a node moves it and the force sim reshapes the graph around it.
    if (hit) {
      onPick(hit.id, e.metaKey || e.ctrlKey);
      const wp = screenToWorld(sx, sy, hit.id);
      dragRef.current = { id: hit.id, dx: hit.x - wp.x, dy: hit.y - wp.y, moved: false };
      sim.pin(hit.id, hit.x, hit.y);
      setCursor('grabbing');
      wrapRef.current!.setPointerCapture(e.pointerId);
      return;
    }

    // Empty space → orbit the camera in 3D, pan the view in 2D.
    if (view3d) {
      dragRef.current = {
        orbit: true,
        startX: sx,
        startY: sy,
        yaw: rotRef.current.yaw,
        pitch: rotRef.current.pitch,
        moved: false,
      };
      setCursor('grabbing');
    } else {
      dragRef.current = {
        pan: true,
        startX: sx,
        startY: sy,
        ox: panZoom.x,
        oy: panZoom.y,
        moved: false,
      };
    }
    wrapRef.current!.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left,
      sy = e.clientY - rect.top;
    if (lassoRef.current) {
      lassoRef.current.x = sx;
      lassoRef.current.y = sy;
      force(Math.random());
      return;
    }
    if (!dragRef.current) {
      const hit = findHit(sx, sy);
      onHover(hit?.id || null);
      setCursor(hit ? 'pointer' : 'grab');
      return;
    }
    const d = dragRef.current;
    if (d.orbit) {
      const dx = sx - (d.startX ?? 0),
        dy = sy - (d.startY ?? 0);
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      rotRef.current.yaw = (d.yaw ?? 0) - dx * 0.01;
      rotRef.current.pitch = Math.max(-1.5, Math.min(1.5, (d.pitch ?? 0) + dy * 0.01));
      setCursor('grabbing');
      return;
    }
    if (d.pan) {
      const dx = sx - (d.startX ?? 0),
        dy = sy - (d.startY ?? 0);
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      setPanZoom({ ...panZoom, x: (d.ox ?? 0) + dx, y: (d.oy ?? 0) + dy });
      setCursor('grabbing');
    } else if (d.id) {
      const wp = screenToWorld(sx, sy, d.id);
      sim.pin(d.id, wp.x + (d.dx ?? 0), wp.y + (d.dy ?? 0));
      sim.restart();
      d.moved = true;
      setCursor('grabbing');
    }
  };

  const onPointerUp = (_e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    wakeRef.current();
    setCursor('grab');
    if (lassoRef.current) {
      const L = lassoRef.current;
      const x1 = Math.min(L.startX, L.x),
        x2 = Math.max(L.startX, L.x);
      const y1 = Math.min(L.startY, L.y),
        y2 = Math.max(L.startY, L.y);
      const inside = sim.nodes
        .filter((n) => {
          const sp = screen(n.x, n.y, n.id);
          return sp.x >= x1 && sp.x <= x2 && sp.y >= y1 && sp.y <= y2;
        })
        .map((n) => n.id);
      onLasso(inside, L.additive);
      lassoRef.current = null;
      force(Math.random());
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    if (d.id) {
      // A plain click releases the node back into the sim; a drag leaves it
      // pinned where it was dropped (double-click a node to unpin it).
      if (!d.moved) sim.unpin(d.id);
    } else if (!d.moved) {
      // A click on empty space (orbit or pan that never moved) clears selection.
      onPick(null, false);
    }
    dragRef.current = null;
  };

  const onPointerCancel = () => {
    // A cancelled gesture (capture lost, touch interrupted) must not leave a live drag/lasso.
    draggingRef.current = false;
    dragRef.current = null;
    lassoRef.current = null;
    setCursor('grab');
    force(Math.random());
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const hit = findHit(e.clientX - rect.left, e.clientY - rect.top);
    if (hit) sim.unpin(hit.id);
  };

  // Wheel zoom must preventDefault or the shell's scroll container scroll-fights the canvas —
  // React 18 attaches root wheel listeners passively, so this binds natively, non-passive.
  const wheelRef = useRef<(e: WheelEvent) => void>(() => {});
  wheelRef.current = (e: WheelEvent) => {
    e.preventDefault();
    wakeRef.current();
    const rect = wrapRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left,
      sy = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    const k2 = Math.max(0.2, Math.min(6, panZoom.k * (1 + delta)));
    const wx = (sx - panZoom.x) / panZoom.k;
    const wy = (sy - panZoom.y) / panZoom.k;
    setPanZoom({ k: k2, x: sx - wx * k2, y: sy - wy * k2 });
  };
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const handler = (e: WheelEvent) => wheelRef.current(e);
    wrap.addEventListener('wheel', handler, { passive: false });
    return () => wrap.removeEventListener('wheel', handler);
  }, []);

  const lasso = lassoRef.current;
  const lassoStyle: React.CSSProperties | null = lasso
    ? {
        position: 'absolute',
        left: Math.min(lasso.startX, lasso.x),
        top: Math.min(lasso.startY, lasso.y),
        width: Math.abs(lasso.x - lasso.startX),
        height: Math.abs(lasso.y - lasso.startY),
        border: '1px dashed oklch(0.783 0.184 159)',
        background: 'oklch(0.783 0.184 159 / 0.08)',
        pointerEvents: 'none',
      }
    : null;

  return (
    <div
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onDoubleClick={onDoubleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onCanvasContext?.({ clientX: e.clientX, clientY: e.clientY });
      }}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor, touchAction: 'none' }}
    >
      <canvas
        ref={cvsRef}
        role="img"
        aria-label="Knowledge graph visualisation — the Nodes panel lists every node for keyboard selection"
        style={{ position: 'absolute', inset: 0 }}
      />
      {lassoStyle && <div style={lassoStyle} />}
    </div>
  );
}
