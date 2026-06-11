// The Eurail workspace (Phase 1): a traversable report canvas + a collapsible onboarder dock, on one
// page. The canvas swaps between report sections (the existing zones) via a hash-routed section nav —
// so the report is browsed in any order, app-like, instead of one long static scroll. The dock holds
// the grounded onboarder (ChatPage variant="dock"); collapse it to a slim rail (desktop) or a sheet
// (mobile). Architected so Phase 2 can render an onboarder-COMPOSED view into the same canvas.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChatPage } from './ChatPage.js';
import { OraclousAvatar } from './OraclousAvatar.js';
import { OrientationZone } from './components/zones/OrientationZone.js';
import { SnapshotZone } from './components/zones/SnapshotZone.js';
import { FindingsZone } from './components/zones/FindingsZone.js';
import { DomainLensesZone } from './components/zones/DomainLensesZone.js';
import { StrategicFrameZone } from './components/zones/StrategicFrameZone.js';
import { EvidenceExplorerZone } from './components/zones/EvidenceExplorerZone.js';
import { ConflictLogZone } from './components/zones/ConflictLogZone.js';
import { EngagementZone } from './components/zones/EngagementZone.js';
import { DocumentLibraryZone } from './components/zones/DocumentLibraryZone.js';
import { MethodologyZone } from './components/zones/MethodologyZone.js';

type ViewKey =
  | 'overview'
  | 'findings'
  | 'domains'
  | 'strategy'
  | 'evidence'
  | 'conflicts'
  | 'engagement'
  | 'documents'
  | 'methodology';

const NAV: { key: ViewKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'findings', label: 'Findings' },
  { key: 'domains', label: 'Domains' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'conflicts', label: 'Conflicts' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'documents', label: 'Documents' },
  { key: 'methodology', label: 'Methodology' },
];
const LABELS = Object.fromEntries(NAV.map((n) => [n.key, n.label])) as Record<ViewKey, string>;

const VIEWS: Record<ViewKey, () => React.ReactNode> = {
  overview: () => (
    <>
      <OrientationZone />
      <div style={{ height: 'var(--sp-12)' }} />
      <SnapshotZone />
    </>
  ),
  findings: () => <FindingsZone />,
  domains: () => <DomainLensesZone />,
  strategy: () => <StrategicFrameZone />,
  evidence: () => <EvidenceExplorerZone />,
  conflicts: () => <ConflictLogZone />,
  engagement: () => <EngagementZone />,
  documents: () => <DocumentLibraryZone />,
  methodology: () => <MethodologyZone />,
};

const KEYS = NAV.map((n) => n.key);
function viewFromHash(): ViewKey {
  const h = window.location.hash.replace(/^#\/?/, '');
  return (KEYS as string[]).includes(h) ? (h as ViewKey) : 'overview';
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export function EurailWorkspace() {
  const [view, setView] = useState<ViewKey>(() => viewFromHash());
  const isMobile = useMediaQuery('(max-width: 900px)');
  // Initialise the dock open on desktop / closed on mobile synchronously (no open→closed flash).
  const [dockOpen, setDockOpen] = useState(() => !window.matchMedia('(max-width: 900px)').matches);
  const [announce, setAnnounce] = useState('');
  // A question pushed into the dock from the canvas ("Ask the onboarder about this"); the nonce makes
  // each ask distinct so the same text can be asked twice.
  const [seed, setSeed] = useState<{ text: string; nonce: number } | null>(null);
  // A live text selection in the report → a floating "Ask about this" affordance at {x,y} (viewport).
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

  const wsRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLButtonElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);
  const prevMobile = useRef(isMobile);

  // Canonicalise the entry URL so "overview" has one address (#/overview), not also the empty hash —
  // otherwise Back from #/overview to the no-hash entry would render the same view and appear to no-op.
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', '#/overview');
  }, []);

  // Deep-linkable + back/forward: the section lives in the URL hash.
  useEffect(() => {
    const on = () => setView(viewFromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  // Open the dock on request from the canvas — a CTA ("Ask the onboarder"), or the selection action
  // ("Ask about this"), which also seeds the question with the selected text.
  useEffect(() => {
    const open = () => setDockOpen(true);
    const ask = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text?.trim();
      if (text) setSeed({ text, nonce: Date.now() });
      setDockOpen(true);
    };
    window.addEventListener('eurail:open-onboarder', open);
    window.addEventListener('eurail:ask', ask as EventListener);
    return () => {
      window.removeEventListener('eurail:open-onboarder', open);
      window.removeEventListener('eurail:ask', ask as EventListener);
    };
  }, []);

  // Crossing into mobile force-closes the dock (a sheet must not start open); returning to desktop
  // does NOT auto-reopen — it respects a user who collapsed it.
  useEffect(() => {
    if (prevMobile.current !== isMobile) {
      if (isMobile) setDockOpen(false);
      prevMobile.current = isMobile;
    }
  }, [isMobile]);

  // Move focus with the dock so keyboard focus is never stranded on <body> when it collapses/expands.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (dockOpen) {
      (document.getElementById('chat-input-dock') as HTMLElement | null)?.focus();
    } else if (!window.matchMedia('(max-width: 900px)').matches) {
      railRef.current?.focus();
    } else {
      fabRef.current?.focus();
    }
  }, [dockOpen]);

  // Mobile sheet = a real modal: trap focus by making the background inert, close on Escape.
  useEffect(() => {
    const bg = canvasRef.current as (HTMLElement & { inert?: boolean }) | null;
    if (bg) bg.inert = isMobile && dockOpen;
    if (!(isMobile && dockOpen)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDockOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile, dockOpen]);

  // Selecting text in the report surfaces a floating "Ask about this" button (issue #6). We capture
  // the text on mouse-up; clicking the button seeds the dock with a plain-language question about it.
  useEffect(() => {
    const onUp = () => {
      const sel = window.getSelection();
      const canvas = canvasRef.current;
      if (!sel || sel.isCollapsed || !sel.rangeCount || !canvas) return setSelection(null);
      const text = sel.toString().trim();
      const anchor = sel.anchorNode;
      const within = anchor && canvas.contains(anchor instanceof Element ? anchor : anchor.parentElement);
      if (text.length < 8 || !within) return setSelection(null);
      const r = sel.getRangeAt(0).getBoundingClientRect();
      setSelection({ text: text.slice(0, 600), x: r.left + r.width / 2, y: r.top });
    };
    const clear = () => setSelection(null);
    // mouseup (mouse) + keyup (Shift+Arrow keyboard selection) both surface the affordance; any
    // scroll/resize clears the fixed-position button so it can't strand at a stale coordinate.
    document.addEventListener('mouseup', onUp);
    document.addEventListener('keyup', onUp);
    window.addEventListener('scroll', clear, true);
    window.addEventListener('resize', clear);
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('keyup', onUp);
      window.removeEventListener('scroll', clear, true);
      window.removeEventListener('resize', clear);
    };
  }, []);

  // Fill the viewport below the global app bar (measured, not a magic number).
  useLayoutEffect(() => {
    const header = document.querySelector('.eurail-appbar');
    const ws = wsRef.current;
    if (!header || !ws) return;
    const apply = () => ws.style.setProperty('--eurail-appbar-h', `${Math.round(header.getBoundingClientRect().height)}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  function go(v: ViewKey) {
    if (window.location.hash !== `#/${v}`) window.location.hash = `/${v}`;
    setView(v);
    viewRef.current?.scrollTo({ top: 0 });
    setAnnounce(`${LABELS[v]} section`);
    // Move focus to the freshly-swapped region so SR/keyboard users are told the content changed.
    viewRef.current?.focus();
    if (isMobile) setDockOpen(false);
  }

  return (
    <div ref={wsRef} className="eurail-ws">
      <main ref={canvasRef} className="eurail-ws__canvas" aria-label="Eurail report">
        <h1 style={SR_ONLY}>Eurail AI-adoption report</h1>
        <nav className="eurail-ws__nav" aria-label="Report sections">
          {NAV.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => go(n.key)}
              aria-current={view === n.key ? 'page' : undefined}
              className={`eurail-ws__tab${view === n.key ? ' is-active' : ''}`}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div
          ref={viewRef}
          className="eurail-ws__view"
          role="region"
          aria-label={`${LABELS[view]} — report section`}
          tabIndex={-1}
          onScroll={() => setSelection(null)}
        >
          <div className="eurail-ws__view-inner">{VIEWS[view]()}</div>
        </div>
      </main>

      {selection && (
        <button
          type="button"
          className="eurail-ws__ask-sel"
          style={{ left: selection.x, top: selection.y }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('eurail:ask', {
                detail: { text: `In plain language, explain this from the report: "${selection.text}"` },
              }),
            );
            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
        >
          <OraclousAvatar size={16} />
          Ask about this
        </button>
      )}

      {isMobile && dockOpen && (
        <button type="button" className="eurail-ws__scrim" aria-label="Close the onboarder" onClick={() => setDockOpen(false)} />
      )}

      <aside
        ref={dockRef}
        className="eurail-ws__dock"
        data-open={dockOpen}
        aria-label="AI onboarder"
        role={isMobile && dockOpen ? 'dialog' : undefined}
        aria-modal={isMobile && dockOpen ? true : undefined}
      >
        {dockOpen ? (
          <ChatPage variant="dock" seed={seed} onCollapse={isMobile ? undefined : () => setDockOpen(false)} />
        ) : (
          !isMobile && (
            <button
              ref={railRef}
              type="button"
              className="eurail-ws__rail"
              aria-label="Ask the onboarder"
              onClick={() => setDockOpen(true)}
            >
              <OraclousAvatar size={32} />
              <span className="eurail-ws__rail-tip" aria-hidden="true">Ask the onboarder</span>
            </button>
          )
        )}
      </aside>

      {isMobile && !dockOpen && (
        <button ref={fabRef} type="button" className="eurail-ws__fab" onClick={() => setDockOpen(true)}>
          <OraclousAvatar size={22} />
          Ask the onboarder
        </button>
      )}

      <div aria-live="polite" style={SR_ONLY}>
        {announce}
      </div>
    </div>
  );
}
