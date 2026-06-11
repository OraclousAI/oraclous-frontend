// History rail for the onboarder (issue #4). Lists past conversations (server-persisted,
// most-recent first); "New chat" starts a fresh one. On desktop it's an always-present, fully
// keyboard-operable rail. On mobile it's an off-canvas drawer: when `collapsed` it is removed from
// the a11y tree (aria-hidden) AND made non-focusable via the DOM `inert` property (set on a ref,
// since @types/react@18 predates the typed `inert` JSX attribute). The a11y state is driven by
// `collapsed` (= mobile && closed), never by desktop visibility — so the rail is never "visible but
// inert".
import { useEffect, useRef } from 'react';
import type { SessionSummary } from '@oraclous/api-client';

/** Compact relative time for the sidebar (e.g. "just now", "4m", "3h", "2d", or a date). */
function relativeTime(ts: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export interface HistorySidebarProps {
  readonly sessions: readonly SessionSummary[];
  readonly activeSessionId: string;
  /** True while the conversation list is being (re)fetched — drives the empty/loading copy. */
  readonly loading: boolean;
  /** True only when the rail is genuinely off-canvas (mobile + closed): then it's hidden + inert. */
  readonly collapsed: boolean;
  readonly onNewChat: () => void;
  readonly onSelect: (sessionId: string) => void;
}

export function HistorySidebar({
  sessions,
  activeSessionId,
  loading,
  collapsed,
  onNewChat,
  onSelect,
}: HistorySidebarProps) {
  const navRef = useRef<HTMLElement>(null);

  // `inert` isn't in @types/react@18's JSX attributes (it became first-class in v19), so set the
  // DOM property imperatively. Removing inert on desktop guarantees the rail is keyboard-operable.
  useEffect(() => {
    const el = navRef.current as (HTMLElement & { inert?: boolean }) | null;
    if (el) el.inert = collapsed;
  }, [collapsed]);

  return (
    <nav
      ref={navRef}
      id="eurail-history"
      aria-label="Conversation history"
      aria-hidden={collapsed || undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
        height: '100%',
        minHeight: 0,
        padding: 'var(--sp-4) var(--sp-3)',
        borderRight: '1px solid var(--rule)',
        background: 'var(--bg-soft)',
      }}
    >
      <button
        type="button"
        onClick={onNewChat}
        className="t-dense"
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-2)',
          width: '100%',
          padding: '8px var(--sp-3)',
          borderRadius: 'var(--r-3)',
          border: '1px solid var(--info)',
          background: 'var(--bg)',
          color: 'var(--info)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '1.1em', lineHeight: 1 }}>
          ＋
        </span>
        New chat
      </button>

      <h2
        id="eurail-recent-h"
        className="t-eyebrow"
        style={{ flex: 'none', color: 'var(--fg-mute)', margin: '2px 0 0', padding: '0 4px', fontWeight: 600 }}
      >
        Recent
      </h2>

      <ul
        aria-labelledby="eurail-recent-h"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {sessions.length === 0 ? (
          <li className="t-caption" style={{ color: 'var(--fg-mute)', padding: '4px' }}>
            {loading ? 'Loading…' : 'No past conversations yet.'}
          </li>
        ) : (
          sessions.map((s) => {
            const active = s.id === activeSessionId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  aria-current={active ? 'true' : undefined}
                  title={s.title}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px var(--sp-3)',
                    borderRadius: 'var(--r-3)',
                    // Active affordance beyond colour: a mint leading bar (≥3:1 on the rail) + bg lift.
                    borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                    background: active ? 'var(--bg)' : 'transparent',
                    color: 'var(--fg)',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="t-dense"
                    style={{
                      display: 'block',
                      fontWeight: active ? 600 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.title || 'New conversation'}
                  </span>
                  <time
                    dateTime={new Date(s.updatedAt).toISOString()}
                    className="t-caption"
                    style={{ color: 'var(--fg-mute)' }}
                  >
                    {relativeTime(s.updatedAt)}
                  </time>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </nav>
  );
}
