// Explorer chrome: search bar, type chips, counts, floating dock, node inspector, and the
// context menu. Ported from legacy-reference/old-frontend src/dash/explorer/ExplorerPanels.tsx
// (clone-and-refactor, §7) — only the components the legacy app actually rendered; the dormant
// algorithm rail / Cypher console / replay / legend / ask panels are deliberately not ported.
// Changes from legacy: suggestion rows and relationship rows are real <button>s with accessible
// names (Gate 3); icon buttons carry aria-labels + aria-pressed; the inspector folds in the
// console's expand-neighbours action and renders real node properties instead of the legacy's
// fixed metric KVs; edge weight chips are omitted (the gateway carries no weight — all 1).
import { useEffect, useRef, type ReactNode } from 'react';
import { IconGlobe, IconRotateCcw, IconRotateCw, IconSearch } from '../../icons/index.js';
import type { OGCommunity, OGEdge, OGNode, OGType } from './explorerTypes.js';
import { typeColor } from './ExplorerCanvas.js';

// ── TopBar: search + suggestions + type chips + live counts ─────────────────
export function ExplorerTopBar(props: {
  totals: { nodes: number; edges: number; shown: number; shownEdges: number };
  query: string;
  setQuery: (v: string) => void;
  typeFilters: Set<string>;
  setTypeFilters: (s: Set<string>) => void;
  types: OGType[];
  suggestions: OGNode[];
  onPickSuggestion: (id: string) => void;
  children?: ReactNode;
}) {
  const {
    totals,
    query,
    setQuery,
    typeFilters,
    setTypeFilters,
    types,
    suggestions,
    onPickSuggestion,
    children,
  } = props;
  const showSuggest = query.trim().length > 0 && suggestions.length > 0;
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl-K focuses the search input (the kbd hint shown beside it).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="og-topbar">
      <div className="og-search">
        <span className="og-search-icon" aria-hidden="true">
          <IconSearch size={13} />
        </span>
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search nodes, labels, relationships…"
          aria-label="Search nodes"
        />
        <span className="og-kbd" aria-hidden="true">
          ⌘K
        </span>
        {showSuggest && (
          <div className="og-suggest" role="group" aria-label="Matching nodes">
            {suggestions.slice(0, 8).map((n) => (
              <button
                type="button"
                className="og-suggest-row"
                key={n.id}
                // preventDefault only — keeps the input from blurring before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickSuggestion(n.id)}
              >
                <span
                  className="og-type-dot"
                  style={{ background: typeColor(n.type) }}
                  aria-hidden="true"
                />
                <span className="og-suggest-name">{n.name}</span>
                <span className="og-suggest-meta">{n.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="og-chips" role="group" aria-label="Filter by node type">
        {types.map((t) => {
          const on = typeFilters.has(t.id);
          return (
            <button
              type="button"
              key={t.id}
              className={'og-chip ' + (on ? 'on' : 'off')}
              aria-pressed={on}
              onClick={() => {
                const next = new Set(typeFilters);
                if (next.has(t.id)) next.delete(t.id);
                else next.add(t.id);
                setTypeFilters(next);
              }}
            >
              <span
                className="og-type-dot"
                style={{ background: typeColor(t.id) }}
                aria-hidden="true"
              />
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="og-meta">
        <span>
          <b className="num">{totals.shown.toLocaleString()}</b> of{' '}
          <b className="num">{totals.nodes.toLocaleString()}</b> nodes
        </span>
        <span className="og-dot" aria-hidden="true">
          ·
        </span>
        <span>
          <b className="num">{totals.shownEdges.toLocaleString()}</b> of{' '}
          <b className="num">{totals.edges.toLocaleString()}</b> edges
        </span>
      </div>
      {children}
    </div>
  );
}

// ── Segmented control ────────────────────────────────────────────────────────
export function Segmented({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="og-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          key={o}
          className={value === o ? 'on' : ''}
          aria-pressed={value === o}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ── FloatingDock — view controls over the canvas ─────────────────────────────
export function FloatingDock(props: {
  panZoom: { k: number; x: number; y: number };
  setPanZoom: (pz: { k: number; x: number; y: number }) => void;
  layoutName: string;
  setLayoutName: (v: string) => void;
  onReset: () => void;
  edgeOpacity: number;
  setEdgeOpacity: (v: number) => void;
  labelDensity: 'none' | 'hover' | 'all';
  setLabelDensity: (v: 'none' | 'hover' | 'all') => void;
  view3d: boolean;
  setView3d: (v: boolean) => void;
  geoEnabled: boolean;
  setGeoEnabled: (v: boolean) => void;
  autoRotate: boolean;
  setAutoRotate: (v: boolean) => void;
  children?: ReactNode;
}) {
  const {
    panZoom,
    setPanZoom,
    layoutName,
    setLayoutName,
    onReset,
    edgeOpacity,
    setEdgeOpacity,
    labelDensity,
    setLabelDensity,
    view3d,
    setView3d,
    geoEnabled,
    setGeoEnabled,
    autoRotate,
    setAutoRotate,
    children,
  } = props;
  return (
    <div className="og-fdock">
      <div className="og-fgroup">
        <button
          type="button"
          className="og-iconbtn"
          onClick={() => setPanZoom({ ...panZoom, k: Math.min(6, panZoom.k * 1.2) })}
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="og-zoom og-mono" aria-live="off">
          {Math.round(panZoom.k * 100)}%
        </div>
        <button
          type="button"
          className="og-iconbtn"
          onClick={() => setPanZoom({ ...panZoom, k: Math.max(0.2, panZoom.k / 1.2) })}
          aria-label="Zoom out"
        >
          −
        </button>
        <button type="button" className="og-iconbtn" onClick={onReset} aria-label="Reset view">
          <IconRotateCcw size={13} />
        </button>
      </div>
      <div className="og-fgroup">
        <span className="og-fdock-lbl" aria-hidden="true">
          View
        </span>
        <button
          type="button"
          className={'og-iconbtn ' + (view3d ? 'on' : '')}
          aria-pressed={view3d}
          onClick={() => setView3d(!view3d)}
          aria-label="3D view"
        >
          3D
        </button>
        <button
          type="button"
          className={'og-iconbtn ' + (geoEnabled ? 'on' : '')}
          aria-pressed={geoEnabled}
          onClick={() => setGeoEnabled(!geoEnabled)}
          aria-label="Earth projection"
        >
          <IconGlobe size={13} />
        </button>
        <button
          type="button"
          className={'og-iconbtn ' + (autoRotate ? 'on' : '')}
          aria-pressed={autoRotate}
          onClick={() => setAutoRotate(!autoRotate)}
          aria-label="Auto-rotate"
        >
          <IconRotateCw size={13} />
        </button>
      </div>
      <div className="og-fgroup">
        <label className="og-fdock-lbl" htmlFor="og-layout">
          Layout
        </label>
        <select id="og-layout" value={layoutName} onChange={(e) => setLayoutName(e.target.value)}>
          <option value="force">Force-directed</option>
          <option value="radial">Radial (focus)</option>
          <option value="cluster">Type cluster</option>
          <option value="hierarchy">Hierarchy (BFS)</option>
          <option value="embedding">Embedding 2D</option>
        </select>
      </div>
      <div className="og-fgroup">
        <span className="og-fdock-lbl" aria-hidden="true">
          Labels
        </span>
        <Segmented
          value={labelDensity}
          options={['none', 'hover', 'all']}
          onChange={(v) => setLabelDensity(v as 'none' | 'hover' | 'all')}
          label="Label density"
        />
      </div>
      <div className="og-fgroup">
        <label className="og-fdock-lbl" htmlFor="og-edges">
          Edges
        </label>
        <input
          id="og-edges"
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={edgeOpacity}
          onChange={(e) => setEdgeOpacity(+e.target.value)}
          style={{ width: 80 }}
          aria-label="Edge opacity"
        />
      </div>
      {children}
    </div>
  );
}

// ── RightInspector — the selected-node panel ─────────────────────────────────
// Real properties from the gateway payload (≤12 primitives, embedding excluded) replace the
// legacy's fixed metric KVs; pagerank/betweenness show only when the data actually carries them.
export function RightInspector(props: {
  node: OGNode | null;
  rawProperties: Readonly<Record<string, unknown>> | null;
  edges: OGEdge[];
  nodes: OGNode[];
  communities: OGCommunity[];
  onPick: (id: string) => void;
  onExpand: (id: string) => void;
  // Keyboard path for pin/unpin — the canvas drag and context menu are pointer-only.
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  expanding: boolean;
  expandError: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const {
    node,
    rawProperties,
    edges,
    nodes,
    onPick,
    onExpand,
    onPin,
    onUnpin,
    expanding,
    expandError,
    collapsed,
    onToggleCollapse,
  } = props;

  if (collapsed || !node) {
    return (
      <div className="og-inspector collapsed" aria-hidden="true">
        <span className="og-collapse-glyph">◌</span>
      </div>
    );
  }

  const nbrs = edges.filter((e) => e.source === node.id || e.target === node.id).slice(0, 14);
  const idMap = new Map(nodes.map((n) => [n.id, n]));
  // Entity-resolution metadata (KGS #269): a resolved node carries `canonical_name` (the chosen
  // display form) and an `aliases` set (the surface-form variants merged into it). Surface them
  // distinctly; they appear only on resolved entities, so render defensively.
  const canonicalName =
    typeof rawProperties?.['canonical_name'] === 'string'
      ? (rawProperties['canonical_name'] as string)
      : null;
  const aliasesRaw = rawProperties?.['aliases'];
  const aliases = Array.isArray(aliasesRaw)
    ? aliasesRaw.filter((a): a is string => typeof a === 'string')
    : [];
  const props12 = Object.entries(rawProperties ?? {})
    .filter(
      ([k, v]) =>
        k !== 'embedding' &&
        k !== 'canonical_name' &&
        k !== 'aliases' &&
        (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
    )
    .slice(0, 12);

  return (
    <aside className="og-inspector" aria-label="Node detail">
      <button
        type="button"
        className="og-collapse-btn inline floating"
        onClick={onToggleCollapse}
        aria-label="Close node detail"
      >
        ›
      </button>
      <div className="og-insp-head">
        <span
          className="og-type-dot lg"
          style={{ background: typeColor(node.type) }}
          aria-hidden="true"
        />
        <div className="og-insp-headtext">
          <h2 className="og-insp-name" title={node.name}>
            {node.name}
          </h2>
          <div className="og-insp-id">
            <span className="og-insp-kind">{node.type.toUpperCase()}</span>
            <span className="og-mono" title={node.id}>
              {node.id}
            </span>
          </div>
        </div>
      </div>
      <div className="og-insp-actions">
        <button
          type="button"
          className="og-btn"
          onClick={() => onExpand(node.id)}
          disabled={expanding}
        >
          {expanding ? 'Expanding…' : 'Expand neighbours'}
        </button>
        <button type="button" className="og-btn" onClick={() => onPin(node.id)}>
          Pin
        </button>
        <button type="button" className="og-btn" onClick={() => onUnpin(node.id)}>
          Unpin
        </button>
      </div>
      {expandError !== null && (
        <p role="alert" className="og-insp-error">
          {expandError}
        </p>
      )}
      {(canonicalName !== null || aliases.length > 0) && (
        <>
          <div className="og-insp-section">Identity</div>
          {canonicalName !== null && (
            <div className="og-kvs">
              <div>
                <span>canonical name</span>
                <b>{canonicalName}</b>
              </div>
            </div>
          )}
          {aliases.length > 0 && (
            <div className="og-aliases">
              <span className="og-aliases-label">
                aliases <span className="og-count num">{aliases.length}</span>
              </span>
              <div className="og-aliases-chips">
                {aliases.map((a) => (
                  <span className="og-alias" key={a} title={a}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <div className="og-insp-section">Properties</div>
      <div className="og-kvs">
        <div>
          <span>type</span>
          <b>{node.type}</b>
        </div>
        <div>
          <span>degree</span>
          <b className="num">{node.degree}</b>
        </div>
        {node.pagerank > 0 && (
          <div>
            <span>pagerank</span>
            <b className="num">{node.pagerank.toFixed(3)}</b>
          </div>
        )}
        {node.betweenness > 0 && (
          <div>
            <span>betweenness</span>
            <b className="num">{node.betweenness.toFixed(3)}</b>
          </div>
        )}
        {props12.map(([k, v]) => {
          const text = String(v);
          return (
            <div key={k}>
              <span>{k}</span>
              <b>{text.length > 220 ? `${text.slice(0, 220)}…` : text}</b>
            </div>
          );
        })}
        {props12.length === 0 && (
          <div>
            <span>properties</span>
            <b>—</b>
          </div>
        )}
      </div>
      <div className="og-insp-section">
        Relationships <span className="og-count num">{nbrs.length}</span>
      </div>
      <div className="og-rels">
        {nbrs.map((e) => {
          const dir = e.source === node.id ? 'out' : 'in';
          const otherId = dir === 'out' ? e.target : e.source;
          const other = idMap.get(otherId);
          if (!other) return null;
          return (
            <button type="button" key={e.id} className="og-rel" onClick={() => onPick(other.id)}>
              <span className="og-rel-arrow" aria-hidden="true">
                {dir === 'out' ? '→' : '←'}
              </span>
              <span className="og-rel-rel og-mono" title={e.rel}>
                {e.rel}
              </span>
              <span className="og-rel-other">
                <span
                  className="og-type-dot"
                  style={{ background: typeColor(other.type) }}
                  aria-hidden="true"
                />
                <span className="og-rel-name" title={other.name}>
                  {other.name}
                </span>
              </span>
            </button>
          );
        })}
        {nbrs.length === 0 && <div className="og-rel-empty">No relationships in view.</div>}
      </div>
    </aside>
  );
}

// ── ContextMenu ──────────────────────────────────────────────────────────────
export interface CtxItem {
  label?: string;
  kbd?: string;
  divider?: boolean;
  onClick?: () => void;
}

export function ContextMenu({
  x,
  y,
  onClose,
  items,
}: {
  x: number;
  y: number;
  onClose: () => void;
  items: CtxItem[];
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Menu pattern: focus moves in on open, arrows cycle, Escape/any-click closes.
    const first = menuRef.current?.querySelector<HTMLButtonElement>('button');
    first?.focus();
    const h = () => onClose();
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const btns = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
        if (btns.length === 0) return;
        const i = btns.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          e.key === 'ArrowDown' ? (i + 1) % btns.length : (i - 1 + btns.length) % btns.length;
        btns[next]?.focus();
      }
    };
    window.addEventListener('click', h);
    window.addEventListener('keydown', k);
    return () => {
      window.removeEventListener('click', h);
      window.removeEventListener('keydown', k);
    };
  }, [onClose]);
  return (
    <div ref={menuRef} className="og-ctx" style={{ left: x, top: y }} role="menu">
      {items.map((it, i) =>
        it.divider ? (
          <div className="og-ctx-div" key={i} role="separator" />
        ) : (
          <button
            type="button"
            key={i}
            className="og-ctx-row"
            role="menuitem"
            onClick={() => {
              it.onClick?.();
              onClose();
            }}
          >
            <span>{it.label}</span>
            {it.kbd && (
              <span className="og-kbd" aria-hidden="true">
                {it.kbd}
              </span>
            )}
          </button>
        )
      )}
    </div>
  );
}
