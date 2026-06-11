// The AI onboarder (issues #1–#5). A bounded chat surface used in two shapes via `variant`:
//   • 'full' — the standalone /eurail/chat page (pinned below the app bar, persistent history sidebar).
//   • 'dock' — the collapsible right dock of the /eurail workspace (fills its container; history as an
//              overlay). Same streaming/session logic; only the chrome differs.
// Bot turns render as rich content (markdown + on-brand grounded SVG diagrams) via <RichMessage/>.
// The question (with prior turns + a sessionId) POSTs to the dev bridge `/eurail/api/chat`, which
// grounds it in the corpus, streams the reply, and persists the turn to disk; the sidebar reads those
// back. All HTTP lives in @oraclous/api-client (CI Gate 1); the sessionId is in-memory only (Gate 2).
//
// There is no auto-printed greeting any more — an empty thread shows a quiet OPENER (a waiting prompt
// + starter chips) so the onboarder doesn't reprint the same header every visit.
//
// Wire protocol the model/bridge emits in the reply text, stripped from DISPLAY by parseReply():
//   `%%END%%`            — reply complete (the bridge's exclusive terminator).
//   `%%CHIPS: a | b | c%%` — quick-reply buttons (lifted into `chips`).
//   `%%DIAGRAM: intent%%` — request for an inline illustration; the bridge appends a ```diagram block
//                         to the SAME stream after the prose. parseReply STRIPS the marker, KEEPS the
//                         block (RichMessage renders it). Stripped live AND on loaded transcripts.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { streamOnboarder, fetchSessions, fetchSession } from '@oraclous/api-client';
import type { SessionSummary } from '@oraclous/api-client';
import { RichMessage } from './chat/RichMessage.js';
import { HistorySidebar } from './chat/HistorySidebar.js';
import { OraclousAvatar } from './OraclousAvatar.js';

interface Msg {
  id: string;
  role: 'bot' | 'user';
  text: string;
  streaming: boolean;
  chips?: string[] | undefined;
  /** The onboarder requested an illustration and the bridge's ```diagram block hasn't arrived yet —
   * keep a "drawing the diagram…" affordance alive (the stream is still open). */
  awaitingDiagram?: boolean | undefined;
  /** Bridge/UI placeholder (offline, empty reply) — excluded from the history sent upstream. */
  error?: boolean;
}

/** Starter prompts for the opener — the role chips (which seed the system-prompt role flow) + a tour. */
const STARTERS = [
  'Board / leadership',
  'Technical & strategy',
  'Commercial & partnership',
  'Assurance & due-diligence',
  'Walk me through it',
];

function genId() {
  return ('c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toLowerCase();
}

// Has a ```diagram fenced block opened in the kept text? Once it has, RichMessage owns it (it holds
// an unclosed block back, renders a closed+valid one) — so the "drawing…" affordance steps aside.
const DIAGRAM_FENCE_OPEN = /(?:^|\n)[ \t]*```[ \t]*diagram\b/;

function parseReply(raw: string): { text: string; chips: string[]; awaitingDiagram: boolean } {
  let text = raw.replace('%%END%%', '');
  let chips: string[] = [];
  const m = text.match(/%%CHIPS:(.*?)%%/s);
  if (m) {
    chips = (m[1] ?? '').split('|').map((c) => c.trim()).filter(Boolean);
    text = text.replace(m[0], '');
  }
  text = text.replace(/%%CHIPS:[^%]*$/s, ''); // hide a partial, not-yet-closed chips token while streaming

  const requestedDiagram = /%%DIAGRAM:/i.test(text);
  text = text.replace(/%%DIAGRAM:.*?%%/gis, ''); // a complete marker (one line, but be newline-tolerant)
  text = text.replace(/%%DIAGRAM:[^%]*$/is, ''); // a partial, not-yet-closed marker while streaming
  const awaitingDiagram = requestedDiagram && !DIAGRAM_FENCE_OPEN.test(text);

  return { text: text.trimEnd(), chips, awaitingDiagram };
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

/** Reactive media-query match (client:only island, so `window` is always present). */
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

export function ChatPage({
  variant = 'full',
  onCollapse,
  seed,
}: {
  variant?: 'full' | 'dock';
  onCollapse?: () => void;
  /** A question pushed in from the canvas (a CTA / "Ask about this"); each distinct `nonce` sends. */
  seed?: { text: string; nonce: number } | null;
} = {}) {
  const isDock = variant === 'dock';
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => genId());
  const [sessions, setSessions] = useState<readonly SessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [announce, setAnnounce] = useState('');

  const threadRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0); // monotonic token: any New chat / session switch supersedes an in-flight run
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const nearBottomRef = useRef(true);
  const historyToggleRef = useRef<HTMLButtonElement>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');
  // History is an overlay (not a persistent column) in the dock and on mobile.
  const overlayHistory = isDock || isMobile;

  // 'full' only: pin the panel to the viewport below the global sticky app bar. Measured at runtime.
  useLayoutEffect(() => {
    if (isDock) return; // the dock fills its container; no viewport measuring
    const header = document.querySelector('.eurail-appbar');
    const panel = panelRef.current;
    if (!header || !panel) return;
    const apply = () => panel.style.setProperty('--eurail-header-h', `${Math.round(header.getBoundingClientRect().height)}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(header);
    return () => ro.disconnect();
  }, [isDock]);

  const refreshSessions = useCallback(async () => {
    setSessionsLoading(true);
    const list = await fetchSessions();
    setSessions(list);
    setSessionsLoading(false);
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  // History overlay (dock/mobile) behaves as a modal: move focus into it on open, Escape closes it
  // and restores focus to the toggle that opened it.
  useEffect(() => {
    if (!(overlayHistory && sidebarOpen)) return;
    (document.querySelector('#eurail-history button') as HTMLElement | null)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        historyToggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlayHistory, sidebarOpen]);

  // Follow the stream only when the reader is already pinned to the bottom. Honour reduced-motion.
  useEffect(() => {
    const el = threadRef.current;
    if (!el || !nearBottomRef.current) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [messages]);

  const onThreadScroll = () => {
    const el = threadRef.current;
    if (el) nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  function setBot(id: string, patch: Partial<Msg>) {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  /** Cancel any in-flight stream/load so a superseded run can't write state into the new context. */
  function supersede() {
    runRef.current += 1;
    readerRef.current?.cancel().catch(() => {});
    readerRef.current = null;
  }

  function newChat() {
    supersede();
    setSessionId(genId());
    setMessages([]);
    setInput('');
    setBusy(false);
    nearBottomRef.current = true;
    if (overlayHistory) setSidebarOpen(false);
  }

  async function selectSession(id: string) {
    if (overlayHistory) setSidebarOpen(false);
    if (id === sessionId && !busy) return; // already showing this conversation
    supersede();
    const loadRun = runRef.current;
    setBusy(false);
    setSessionId(id);
    nearBottomRef.current = true;
    const file = await fetchSession(id);
    if (runRef.current !== loadRun) return; // superseded during the load
    if (!file) {
      setMessages([]);
      return;
    }
    const loaded: Msg[] = [];
    file.turns.forEach((turn, i) => {
      if (turn.role === 'user') {
        loaded.push({ id: `s${i}u`, role: 'user', text: turn.content, streaming: false });
      } else {
        const { text, chips } = parseReply(turn.content);
        loaded.push({ id: `s${i}b`, role: 'bot', text, streaming: false, ...(chips.length ? { chips } : {}) });
      }
    });
    setMessages(loaded);
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const run = ++runRef.current;
    setBusy(true);
    setInput('');
    setMessages((ms) => ms.map((m) => (m.chips ? { ...m, chips: undefined } : m)));
    const id = genId();
    setMessages((ms) => [
      ...ms,
      { id: id + '-u', role: 'user', text: t, streaming: false },
      { id, role: 'bot', text: '', streaming: true },
    ]);
    nearBottomRef.current = true;
    const history = messages
      .filter((m) => !!m.text && !m.error)
      .map((m) => ({ role: m.role === 'user' ? ('user' as const) : ('assistant' as const), content: m.text }));
    const sid = sessionId;

    // ── Smooth typewriter: decouple the DISPLAY from network burstiness. The network loop fills
    //    `target` (prose only — the ```diagram block is held back for the final RichMessage); a rAF
    //    loop eases the shown text toward it so even a chunky stream types out smoothly, the cursor
    //    riding the end. It finalises (switch to formatted RichMessage + chips) once the stream is
    //    complete AND the reveal has caught up.
    let acc = '';
    let target = '';
    let shown = '';
    let awaiting = false;
    let netDone = false;
    const stripDiagram = (s: string) => s.replace(/(?:^|\n)[ \t]*```[ \t]*diagram[\s\S]*$/i, '').trimEnd();
    const endRun = () => {
      if (runRef.current === run) {
        setBusy(false);
        readerRef.current = null;
      }
    };
    const reveal = () => {
      if (runRef.current !== run) return; // superseded — stop the loop
      if (shown.length < target.length) {
        const step = Math.max(1, Math.ceil((target.length - shown.length) / 5));
        shown = target.slice(0, shown.length + step);
        setBot(id, { text: shown, streaming: true, awaitingDiagram: awaiting && shown.length >= target.length });
      } else if (netDone) {
        const { text: finalText, chips } = parseReply(acc);
        setBot(id, { text: finalText || '(no response)', streaming: false, chips, awaitingDiagram: false, error: !finalText });
        if (finalText) setAnnounce(finalText);
        void refreshSessions();
        endRun();
        return; // done — stop the loop
      } else if (awaiting) {
        setBot(id, { awaitingDiagram: true }); // prose caught up; waiting on the diagram block
      }
      requestAnimationFrame(reveal);
    };
    requestAnimationFrame(reveal);

    try {
      const stream = await streamOnboarder({ sessionId: sid, id, text: t, history });
      if (runRef.current !== run) {
        await stream.cancel().catch(() => {});
        return;
      }
      const reader = stream.getReader();
      readerRef.current = reader;
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (runRef.current !== run) {
          await reader.cancel().catch(() => {});
          return;
        }
        acc += dec.decode(value, { stream: true });
        const live = parseReply(acc);
        target = stripDiagram(live.text);
        awaiting = live.awaitingDiagram;
      }
      netDone = true; // the reveal loop drains the tail, then finalises
    } catch {
      if (runRef.current !== run) return;
      setBot(id, { text: '(the onboarder model is unreachable — check the dev bridge)', streaming: false, error: true });
      endRun();
    }
  }

  // A canvas "Ask about this" (or CTA) pushes a question in via `seed` — send it once per nonce. If a
  // turn is mid-stream (busy), DON'T consume the nonce; the effect re-runs when busy clears and the
  // queued ask then sends (otherwise the ask would be silently dropped).
  const lastSeed = useRef(0);
  useEffect(() => {
    if (seed?.text && seed.nonce !== lastSeed.current && !busy) {
      lastSeed.current = seed.nonce;
      void send(seed.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, busy]);

  const lastId = messages[messages.length - 1]?.id;

  return (
    <div
      ref={panelRef}
      className={isDock ? 'eurail-chat-panel eurail-chat-panel--dock' : 'eurail-chat-panel'}
      style={{
        position: 'relative',
        display: 'flex',
        height: isDock ? '100%' : 'calc(100dvh - var(--eurail-header-h, 56px))',
        minHeight: isDock ? 0 : 420,
        overflow: 'hidden',
        ...(isDock ? {} : { borderTop: '1px solid var(--border-hair)' }),
      }}
    >
      <HistorySidebar
        sessions={sessions}
        activeSessionId={sessionId}
        loading={sessionsLoading}
        collapsed={overlayHistory && !sidebarOpen}
        onNewChat={newChat}
        onSelect={selectSession}
      />

      {overlayHistory && sidebarOpen && (
        <button
          type="button"
          className="eurail-chat-scrim"
          aria-label="Close conversation history"
          onClick={() => {
            setSidebarOpen(false);
            historyToggleRef.current?.focus();
          }}
        />
      )}

      <div className="eurail-chat-col" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0, paddingInline: isDock ? 'var(--sp-5)' : 0 }}>
        {/* Dock + mobile: a slim header carrying the history toggle (and, in the dock, a New-chat). */}
        {overlayHistory && (
          <header
            style={{
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-2)',
              height: 44,
              borderBottom: '1px solid var(--border-hair)',
            }}
          >
            <button
              ref={historyToggleRef}
              type="button"
              className="eurail-chat-menu"
              aria-label="Show conversation history"
              aria-expanded={sidebarOpen}
              aria-controls="eurail-history"
              onClick={() => setSidebarOpen((o) => !o)}
              style={{ border: '1px solid var(--rule)', background: 'var(--bg)', color: 'var(--fg)', borderRadius: 'var(--r-2)', width: 34, height: 34, cursor: 'pointer', flex: 'none' }}
            >
              <span aria-hidden="true">☰</span>
            </button>
            <span className="t-dense" style={{ color: 'var(--fg-mute)', marginRight: 'auto' }}>
              {isDock ? 'Onboarder' : 'History'}
            </span>
            {isDock && (
              <button
                type="button"
                onClick={newChat}
                className="t-dense"
                style={{ border: '1px solid var(--rule)', background: 'var(--bg)', color: 'var(--fg)', borderRadius: 'var(--r-2)', padding: '4px var(--sp-3)', cursor: 'pointer', flex: 'none' }}
              >
                New
              </button>
            )}
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Collapse the onboarder"
                style={{ border: '1px solid var(--rule)', background: 'var(--bg)', color: 'var(--fg)', borderRadius: 'var(--r-2)', width: 34, height: 34, cursor: 'pointer', flex: 'none' }}
              >
                <span aria-hidden="true">→</span>
              </button>
            )}
          </header>
        )}

        <div
          ref={threadRef}
          onScroll={onThreadScroll}
          aria-label="Onboarding conversation"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', padding: 'var(--sp-5) 0' }}
        >
          {messages.length === 0 ? (
            // ── Dynamic opener: waits for the user, offers starters — no reprinted greeting. ──
            <div style={{ display: 'grid', gap: 'var(--sp-4)', padding: 'var(--sp-4) 0' }}>
              <OraclousAvatar size={40} />
              <p className="t-body" style={{ color: 'var(--fg)', margin: 0, maxWidth: '42ch' }}>
                Ask anything about the analysis — every answer traces back to the evidence. Pick a lens to start, or just type a question.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                {STARTERS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="eurail-chip">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              const showChips = !!m.chips && m.id === lastId && !m.streaming;
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 'var(--sp-2)' }}>
                  <div
                    className="t-body"
                    aria-busy={m.role === 'bot' && m.streaming ? true : undefined}
                    style={{
                      maxWidth: 'min(92%, 60ch)',
                      display: 'flex',
                      gap: '0.5em',
                      alignItems: 'flex-start',
                      padding: 'var(--sp-3) var(--sp-4)',
                      borderRadius: 'var(--r-4)',
                      background: isUser ? 'var(--ink)' : 'var(--bg-soft)',
                      color: isUser ? 'var(--paper)' : 'var(--fg)',
                      border: isUser ? 'none' : '1px solid var(--rule)',
                    }}
                  >
                    {/* Terminal prompt mark — currentColor (ink on the light bubble, paper on the dark
                        one); NEVER mint. The mint is reserved for the live "I" cursor. Dropped in the
                        narrow dock, where a per-bubble glyph is repetitive noise. */}
                    {!isDock && (
                      <span aria-hidden="true" className="t-mono" style={{ flex: 'none', color: 'currentColor', fontWeight: 700, lineHeight: 1.55 }}>
                        &gt;
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0, ...(isUser ? { whiteSpace: 'pre-wrap' } : {}) }}>
                      {isUser ? (
                        m.text
                      ) : m.streaming ? (
                        // Smooth typewriter: plain prose with the mint "I" cursor riding the end (it
                        // moves WITH the text). Formatting/diagrams snap in via RichMessage once done.
                        <span style={{ whiteSpace: 'pre-wrap' }}>
                          {m.text || <span className="t-dense" style={{ color: 'var(--fg-mute)' }}>thinking…</span>}
                          <span
                            className="is-blink"
                            aria-hidden="true"
                            style={{ display: 'inline-block', width: 2, height: '1.05em', marginLeft: 2, background: 'var(--accent)', verticalAlign: 'text-bottom' }}
                          />
                        </span>
                      ) : m.text ? (
                        <RichMessage text={m.text} />
                      ) : null}
                      {m.role === 'bot' && m.streaming && m.awaitingDiagram && (
                        <span
                          role="status"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)', color: 'var(--fg-mute)' }}
                        >
                          <span className="is-pulse" aria-hidden="true" style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', flex: 'none' }} />
                          <span className="t-dense">Drawing your illustration…</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {showChips && (
                    <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', maxWidth: 'min(92%, 60ch)' }}>
                      {m.chips!.map((chip) => (
                        <button key={chip} type="button" onClick={() => send(chip)} className="eurail-chip">
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Composer — one rounded design-system input with the send as an embedded icon button. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          style={{ flex: 'none', paddingTop: 'var(--sp-2)' }}
        >
          <label htmlFor={`chat-input-${variant}`} style={SR_ONLY}>Ask the onboarder</label>
          <div className="eurail-composer">
            <textarea
              id={`chat-input-${variant}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask about the analysis…"
            />
            <button type="submit" className="eurail-composer__send" disabled={busy || !input.trim()} aria-label="Send message">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </form>

        {!isDock && (
          <p className="t-caption" style={{ flex: 'none', color: 'var(--fg-mute)', margin: 'var(--sp-2) 0 var(--sp-3)' }}>
            Dev preview — answers stream from a configured model and conversations are saved locally.{' '}
            <a href="/eurail" style={{ color: 'var(--info)' }}>Skip and browse the dashboard</a>.
          </p>
        )}
      </div>

      {/* Announce only completed bot replies (not every streamed token). */}
      <div aria-live="polite" style={SR_ONLY}>{announce}</div>
    </div>
  );
}
