// A modal that reveals a DISPLAY-ONCE secret exactly once — an integration-key plaintext token or
// a webhook signing secret. The value is never persisted (CLAUDE.md §1.5): the caller holds it in
// component state, passes it here, and discards it on close. The modal forces an explicit
// acknowledgement (you must dismiss it) so the secret isn't lost silently.
//
// Accessibility (Gate 3 / WCAG AA): role="dialog" + aria-modal, labelled by its title, focus moves
// into the dialog on open and is trapped (Tab cycles within), Escape and the backdrop close it, and
// focus returns to the element that opened it. The copy action announces success via aria-live.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import './DisplayOnceSecretModal.css';

export interface SecretMetaField {
  readonly label: string;
  readonly value: string;
}

export function DisplayOnceSecretModal({
  title,
  secret,
  secretLabel,
  note,
  fields,
  onClose,
}: {
  title: string;
  secret: string;
  secretLabel: string;
  note?: ReactNode;
  fields?: readonly SecretMetaField[];
  onClose: () => void;
}) {
  const titleId = useId();
  const secretId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Restore focus to whatever was focused before the modal opened, on unmount.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    return () => opener?.focus?.();
  }, []);

  // Move focus into the dialog on open.
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  // Escape to close + a simple focus trap that cycles Tab within the dialog.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (first === undefined || last === undefined) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      // Clipboard may be unavailable; the value stays selectable in the field.
    }
  }

  return (
    <div className="dos-backdrop" onMouseDown={onClose}>
      <div
        className="dos-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dos-head">
          <h2 id={titleId} className="dos-title">
            {title}
          </h2>
          <button type="button" className="dos-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className="dos-warn" role="alert">
          This is the only time the secret is shown. Copy it now and store it securely — it cannot
          be retrieved again.
        </p>

        <label className="dos-field-label" htmlFor={secretId}>
          {secretLabel}
        </label>
        <div className="dos-secret-row">
          <input
            id={secretId}
            className="dos-secret num"
            value={secret}
            readOnly
            data-autofocus
            onFocus={(e) => e.currentTarget.select()}
            spellCheck={false}
          />
          <button type="button" className="dos-copy" onClick={onCopy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <span className="dos-live" role="status" aria-live="polite">
          {copied ? 'Secret copied to clipboard.' : ''}
        </span>

        {note !== undefined && <div className="dos-note">{note}</div>}

        {fields !== undefined && fields.length > 0 && (
          <dl className="dos-meta">
            {fields.map((f) => (
              <div key={f.label} className="dos-meta-row">
                <dt>{f.label}</dt>
                <dd className="num">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="dos-actions">
          <button type="button" className="dos-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
