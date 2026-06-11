// EvidencePopover — DEC-001. The claim→evidence drill-path, native to the claim's typography.
// The claim is a real <button> with a dotted --info underline + a superscript evidence count;
// activating it opens a role="dialog" with focus-trap, Esc-to-close (restoring focus to the
// trigger), and outside-click close. Renders each evidence record with its ConfidenceBadge,
// source link, and a disputed flag when a conflict references it.
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { EvidenceLink } from '../../corpus/types.js';
import { resolveEvidence, conflictsForEvidence } from '../../corpus/index.js';
import { ConfidenceBadge } from './ConfidenceBadge.js';
import { Icon } from './Icon.js';

const NARROW = 768;

export function EvidencePopover({
  claim,
  evidenceIds,
}: {
  claim: ReactNode;
  evidenceIds: EvidenceLink[];
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; narrow: boolean }>({
    top: 0,
    left: 0,
    width: 420,
    narrow: false,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  const records = resolveEvidence(evidenceIds);
  const count = records.length;

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Anchor the (portaled) dialog under the trigger; on narrow it becomes a bottom sheet.
  const reposition = useCallback(() => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const narrow = window.innerWidth < NARROW;
    const width = Math.min(420, window.innerWidth - 24);
    const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12));
    setPos({ top: r.bottom + 6, left, width, narrow });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, reposition]);

  // Focus the dialog on open; trap Tab; Esc closes; outside-click closes.
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    dialog?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) {
        e.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (
        dialog &&
        !dialog.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        close();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, close]);

  if (count === 0) {
    // No evidence to show — render the claim as plain text (never a dead affordance).
    return <span>{claim}</span>;
  }

  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => setOpen((v) => !v)}
        style={{
          font: 'inherit',
          color: 'inherit',
          background: 'none',
          border: 0,
          padding: 0,
          margin: 0,
          textAlign: 'left',
          cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textDecorationColor: 'var(--info)',
          textUnderlineOffset: '3px',
        }}
      >
        {claim}
        <sup
          className="t-mono"
          aria-hidden="true"
          style={{ color: 'var(--info)', fontSize: '0.7em', marginLeft: '1px' }}
        >
          {count}
        </sup>
        <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          ({count} supporting evidence records)
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-label="Supporting evidence"
            tabIndex={-1}
            className="evidence-dialog"
            style={
              pos.narrow
                ? {
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 50,
                    maxHeight: '70vh',
                    overflow: 'auto',
                    background: 'var(--bg)',
                    borderTop: '1px solid var(--rule)',
                    borderTopLeftRadius: 'var(--r-4)',
                    borderTopRightRadius: 'var(--r-4)',
                    boxShadow: 'var(--shadow-3)',
                    padding: 'var(--sp-4)',
                    textAlign: 'left',
                  }
                : {
                    position: 'fixed',
                    top: pos.top,
                    left: pos.left,
                    zIndex: 50,
                    width: pos.width,
                    maxHeight: '60vh',
                    overflow: 'auto',
                    background: 'var(--bg)',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--r-4)',
                    boxShadow: 'var(--shadow-3)',
                    padding: 'var(--sp-3)',
                    textAlign: 'left',
                  }
            }
          >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--sp-2)',
            }}
          >
            <span className="t-eyebrow" style={{ color: 'var(--fg-mute)' }}>
              {count} evidence record{count === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close evidence"
              style={{
                display: 'inline-flex',
                background: 'none',
                border: 0,
                cursor: 'pointer',
                color: 'var(--fg-mute)',
                padding: 2,
              }}
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-3)' }}>
            {records.map((rec) => {
              const disputed = conflictsForEvidence(rec.id).length > 0;
              return (
                <li
                  key={rec.id}
                  style={{
                    display: 'grid',
                    gap: 'var(--sp-1)',
                    paddingBottom: 'var(--sp-3)',
                    borderBottom: '1px solid var(--border-hair)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    <span className="t-mono" style={{ fontSize: '11px', color: 'var(--fg-mute)' }}>
                      {rec.id}
                    </span>
                    <ConfidenceBadge label={rec.label} level={rec.confidence} />
                  </div>
                  <p className="t-dense" style={{ margin: 0 }}>
                    {rec.claim}
                  </p>
                  <a
                    href={rec.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-caption"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--sp-1)',
                      color: 'var(--info)',
                    }}
                  >
                    {rec.source.name} · {rec.source.type}
                    <Icon name="external" size={12} />
                  </a>
                  {disputed && (
                    <span
                      className="t-caption"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--sp-1)',
                        color: 'var(--fg)',
                        borderLeft: '3px solid var(--perm-denied)',
                        paddingLeft: 'var(--sp-2)',
                      }}
                    >
                      <Icon name="alert" size={13} />
                      Disputed — see the conflict log
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>,
          document.body
        )}
    </span>
  );
}
