// Tool detail drawer (Tools — increments 1 & 3). A panel opened from a tool tile that renders the
// tool's catalogue data (what it does, what it needs to run, docs) and lets an org configure it:
// "Set up this tool" creates a tool *instance* (POST /api/v1/instances) and the tool's instances are
// listed here (increment 3). Focus trap, Escape-to-close, scroll-lock, and focus-restore to the
// originating tile come from useDrawerA11y. Credential attachment + validation are later increments.
import { useId, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ApiClientError, type Tool } from '@oraclous/api-client';
import { useCreateInstance, useInstances } from '../lib/agents.js';
import { useToast } from '../lib/toast.jsx';
import { useDrawerA11y } from './shell/useDrawerA11y.js';
import { IconX } from '../icons/index.js';

// Only render a documentation link if it is an http(s) URL (org-registered tools could supply
// arbitrary values; never emit a javascript:/data: href).
function safeDocUrl(url: string | null): string | null {
  return url !== null && /^https?:\/\//i.test(url) ? url : null;
}

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

// "CONFIGURATION_REQUIRED" → "configuration required" for display.
function humanizeStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, ' ');
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
  const setupNameId = useId();
  const setupHintId = useId();
  const setupErrId = useId();
  useDrawerA11y({ open: true, drawerRef: panelRef, triggerRef, onClose });

  const { instances, isLoading: instancesLoading, isError: instancesError } = useInstances();
  // This tool's instances (the catalogue tool id is the instance's capability id).
  const toolInstances = useMemo(
    () => instances.filter((i) => i.capabilityId === tool.id),
    [instances, tool.id]
  );
  const createInstance = useCreateInstance();
  const toast = useToast();
  const [setupName, setSetupName] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);

  const doc = safeDocUrl(tool.documentationUrl);
  const setupInvalid = setupError !== null;

  async function onSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSetupError(null);
    // configuration/settings default to {} server-side; naming is the only input this increment.
    const name = setupName.trim() || tool.name;
    try {
      const instance = await createInstance.mutateAsync({ capabilityId: tool.id, name });
      toast.success(`Set up ${instance.name}.`);
      setSetupName('');
      // Keep the drawer open so the new instance shows in the list below.
    } catch (cause) {
      setSetupError(messageFor(cause));
    }
  }

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

          <section className="tool-drawer__section">
            <h3>Set up</h3>
            <div aria-live="polite">
              {instancesLoading ? (
                <p className="tool-drawer__muted">Loading instances…</p>
              ) : instancesError ? (
                <p className="tool-drawer__muted">Could not load this tool's instances.</p>
              ) : toolInstances.length > 0 ? (
                <ul className="tool-inst-list">
                  {toolInstances.map((inst) => (
                    <li key={inst.id} className="tool-inst">
                      <span className="tool-inst__name">{inst.name}</span>
                      <span className="chip chip-sm">{humanizeStatus(inst.status)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="tool-drawer__muted">
                  Not set up yet. Create a configured instance to use this tool.
                </p>
              )}
            </div>

            <form className="tool-inst-form" onSubmit={onSetup}>
              <div className="field">
                <label htmlFor={setupNameId}>Instance name</label>
                <input
                  id={setupNameId}
                  value={setupName}
                  onChange={(e) => {
                    setSetupName(e.target.value);
                    if (setupError !== null) setSetupError(null);
                  }}
                  autoComplete="off"
                  maxLength={255}
                  placeholder={tool.name}
                  aria-invalid={setupInvalid || undefined}
                  aria-describedby={setupInvalid ? `${setupHintId} ${setupErrId}` : setupHintId}
                />
                <span id={setupHintId} className="hint">
                  A name for this configured instance.
                </span>
              </div>
              {setupError !== null && (
                <p id={setupErrId} className="field" role="alert">
                  <span className="error-text">{setupError}</span>
                </p>
              )}
              <div className="btn-row">
                <button
                  type="submit"
                  className="btn"
                  data-variant="primary"
                  disabled={createInstance.isPending}
                >
                  {createInstance.isPending ? 'Setting up…' : 'Set up this tool'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
