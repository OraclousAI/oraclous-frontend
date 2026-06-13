// Tool detail drawer (Tools — increment 1). A read-only panel opened from a tool tile that renders
// entirely from the tool object already in the catalogue list (no extra gateway call): what the tool
// does (its capabilities) and what it needs to run (its credential requirements). Focus trap,
// Escape-to-close, body scroll-lock, and focus-restore to the originating tile come from useDrawerA11y.
import { useId, useRef, type RefObject } from 'react';
import type { Tool } from '@oraclous/api-client';
import { useDrawerA11y } from './shell/useDrawerA11y.js';
import { IconX } from '../icons/index.js';

// Only render a documentation link if it is an http(s) URL (org-registered tools could supply
// arbitrary values; never emit a javascript:/data: href).
function safeDocUrl(url: string | null): string | null {
  return url !== null && /^https?:\/\//i.test(url) ? url : null;
}

export function ToolDetailDrawer({
  tool,
  triggerRef,
  onClose,
}: {
  tool: Tool;
  // The tile that opened the drawer — focus returns to it on close.
  triggerRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDrawerA11y({ open: true, drawerRef: panelRef, triggerRef, onClose });

  const doc = safeDocUrl(tool.documentationUrl);

  return (
    <>
      <button
        type="button"
        className="tool-drawer__backdrop"
        aria-label="Close tool details"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        className="tool-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="tool-drawer__head">
          <div className="tool-drawer__title">
            <h2 id={titleId}>{tool.name}</h2>
            {tool.category !== null && <span className="chip chip-sm">{tool.category}</span>}
          </div>
          <button type="button" className="tool-drawer__close" aria-label="Close" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <div className="tool-drawer__body">
          {tool.description !== null ? (
            <p className="tool-drawer__desc">{tool.description}</p>
          ) : (
            <p className="tool-drawer__muted">No description provided.</p>
          )}

          <section className="tool-drawer__section">
            <h3>What this tool can do</h3>
            {tool.capabilities.length > 0 ? (
              <ul className="tool-cap-list">
                {tool.capabilities.map((c) => (
                  <li key={c.name} className="tool-cap">
                    <span className="tool-cap__name">{c.name}</span>
                    {c.description !== null && (
                      <span className="tool-cap__desc">{c.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tool-drawer__muted">No capabilities are listed for this tool.</p>
            )}
          </section>

          <section className="tool-drawer__section">
            <h3>What it needs to run</h3>
            {tool.credentialRequirements.length > 0 ? (
              <ul className="tool-req-list">
                {tool.credentialRequirements.map((r) => (
                  <li key={`${r.type}:${r.provider}`} className="tool-req">
                    <span className="tool-req__type">{r.type}</span>
                    <span className="tool-req__provider">{r.provider}</span>
                    {!r.required && <span className="chip chip-sm">optional</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tool-drawer__muted">This tool needs no credentials to run.</p>
            )}
          </section>

          {doc !== null && (
            <a href={doc} target="_blank" rel="noopener noreferrer" className="tool-drawer__doc">
              Documentation ↗
            </a>
          )}
        </div>
      </div>
    </>
  );
}
