// Add-a-tool drawer (Tools — increment 2). An admin form that registers an org tool descriptor via
// POST /api/v1/tools (through the typed api-client — no bare fetch). A non-MCP descriptor lands
// status='active', so the tool appears in the catalogue immediately. Reuses the increment-1 drawer
// chrome + useDrawerA11y (focus trap, Esc, scroll-lock, focus-restore to the "Add a tool" button).
import { useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ApiClientError } from '@oraclous/api-client';
import { useRegisterTool } from '../lib/tools.js';
import { useToast } from '../lib/toast.jsx';
import { useDrawerA11y } from './shell/useDrawerA11y.js';
import { IconPlus, IconX } from '../icons/index.js';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

// Editable rows carry a stable id so React keys survive insertion/removal (never the array index,
// which would re-key the wrong row on delete and mismanage focus).
interface CapabilityRow {
  id: number;
  name: string;
  description: string;
}
interface RequirementRow {
  id: number;
  type: string;
  provider: string;
}

export function AddToolDrawer({
  triggerRef,
  onClose,
}: {
  // The "Add a tool" button — focus returns to it on close.
  triggerRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  // Focus lands here after a row is removed, so keyboard focus is never lost to a detached node.
  const addCapBtnRef = useRef<HTMLButtonElement>(null);
  const addReqBtnRef = useRef<HTMLButtonElement>(null);
  const nextRowId = useRef(0);
  const titleId = useId();
  const nameId = useId();
  const categoryId = useId();
  const docId = useId();
  const descId = useId();
  const errId = useId();
  const registerTool = useRegisterTool();
  const toast = useToast();
  useDrawerA11y({ open: true, drawerRef: panelRef, triggerRef, onClose });

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [documentationUrl, setDocumentationUrl] = useState('');
  const [capabilities, setCapabilities] = useState<CapabilityRow[]>([]);
  const [requirements, setRequirements] = useState<RequirementRow[]>([]);
  // A single form error; `invalidField` points the aria-describedby at the offending control.
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<'name' | 'doc' | null>(null);

  function clearError(field: 'name' | 'doc') {
    if (invalidField === field) {
      setError(null);
      setInvalidField(null);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInvalidField(null);
    const trimmedName = name.trim();
    if (trimmedName === '') {
      setInvalidField('name');
      setError('Enter a name for the tool.');
      nameInputRef.current?.focus();
      return;
    }
    const trimmedDoc = documentationUrl.trim();
    if (trimmedDoc !== '' && !/^https?:\/\//i.test(trimmedDoc)) {
      setInvalidField('doc');
      setError('The documentation URL must start with http:// or https://.');
      docInputRef.current?.focus();
      return;
    }
    try {
      const tool = await registerTool.mutateAsync({
        name: trimmedName,
        category: category.trim() || null,
        description: description.trim() || null,
        documentationUrl: trimmedDoc || null,
        capabilities: capabilities
          .map((c) => ({ name: c.name.trim(), description: c.description.trim() || null }))
          .filter((c) => c.name !== ''),
        credentialRequirements: requirements
          .map((r) => ({ type: r.type.trim(), provider: r.provider.trim(), required: true }))
          .filter((r) => r.type !== '' && r.provider !== ''),
      });
      toast.success(`Added ${tool.name} to the catalogue.`);
      onClose();
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  const nameInvalid = invalidField === 'name';
  const docInvalid = invalidField === 'doc';

  return (
    <>
      <button
        type="button"
        className="tool-drawer__backdrop"
        aria-label="Close add tool form"
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
            <h2 id={titleId}>Add a tool</h2>
          </div>
          <button type="button" className="tool-drawer__close" aria-label="Close" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <form className="tool-drawer__body tool-form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor={nameId}>Name</label>
            <input
              id={nameId}
              ref={nameInputRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError('name');
              }}
              autoComplete="off"
              maxLength={128}
              aria-invalid={nameInvalid || undefined}
              aria-describedby={nameInvalid ? errId : undefined}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor={categoryId}>Category</label>
              <input
                id={categoryId}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                autoComplete="off"
                placeholder="e.g. INGESTION"
              />
              <span className="hint">Groups the tool in the catalogue.</span>
            </div>
            <div className="field">
              <label htmlFor={docId}>Documentation URL</label>
              <input
                id={docId}
                ref={docInputRef}
                value={documentationUrl}
                onChange={(e) => {
                  setDocumentationUrl(e.target.value);
                  clearError('doc');
                }}
                autoComplete="off"
                placeholder="https://example.com/docs"
                aria-invalid={docInvalid || undefined}
                aria-describedby={docInvalid ? errId : undefined}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor={descId}>Description</label>
            <textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <section className="tool-form__section">
            <div className="tool-form__section-head">
              <h3>What this tool can do</h3>
              <button
                type="button"
                className="btn"
                data-variant="secondary"
                data-size="sm"
                ref={addCapBtnRef}
                onClick={() =>
                  setCapabilities((rows) => [
                    ...rows,
                    { id: nextRowId.current++, name: '', description: '' },
                  ])
                }
              >
                <IconPlus size={14} />
                Add capability
              </button>
            </div>
            {capabilities.length === 0 ? (
              <p className="tool-drawer__muted">
                No capabilities yet. Add the operations this tool offers.
              </p>
            ) : (
              <>
                <div className="tool-form__colhead" aria-hidden="true">
                  <span>Name</span>
                  <span>Description</span>
                  <span />
                </div>
                <ul className="tool-form__rows">
                  {capabilities.map((c, i) => (
                    <li key={c.id} className="tool-form__row">
                      <input
                        aria-label={`Capability ${i + 1} name`}
                        value={c.name}
                        placeholder="Name"
                        onChange={(e) =>
                          setCapabilities((rows) =>
                            rows.map((row) =>
                              row.id === c.id ? { ...row, name: e.target.value } : row
                            )
                          )
                        }
                      />
                      <input
                        aria-label={`Capability ${i + 1} description`}
                        value={c.description}
                        placeholder="Description"
                        onChange={(e) =>
                          setCapabilities((rows) =>
                            rows.map((row) =>
                              row.id === c.id ? { ...row, description: e.target.value } : row
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        className="tool-form__remove"
                        aria-label={`Remove capability ${i + 1}`}
                        onClick={() => {
                          setCapabilities((rows) => rows.filter((row) => row.id !== c.id));
                          addCapBtnRef.current?.focus();
                        }}
                      >
                        <IconX size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="tool-form__section">
            <div className="tool-form__section-head">
              <h3>What it needs to run</h3>
              <button
                type="button"
                className="btn"
                data-variant="secondary"
                data-size="sm"
                ref={addReqBtnRef}
                onClick={() =>
                  setRequirements((rows) => [
                    ...rows,
                    { id: nextRowId.current++, type: '', provider: '' },
                  ])
                }
              >
                <IconPlus size={14} />
                Add requirement
              </button>
            </div>
            {requirements.length === 0 ? (
              <p className="tool-drawer__muted">
                No credential requirements. Add what the tool needs to authenticate.
              </p>
            ) : (
              <>
                <div className="tool-form__colhead" aria-hidden="true">
                  <span>Type</span>
                  <span>Provider</span>
                  <span />
                </div>
                <ul className="tool-form__rows">
                  {requirements.map((r, i) => (
                    <li key={r.id} className="tool-form__row">
                      <input
                        aria-label={`Requirement ${i + 1} type`}
                        value={r.type}
                        placeholder="e.g. api_key"
                        onChange={(e) =>
                          setRequirements((rows) =>
                            rows.map((row) =>
                              row.id === r.id ? { ...row, type: e.target.value } : row
                            )
                          )
                        }
                      />
                      <input
                        aria-label={`Requirement ${i + 1} provider`}
                        value={r.provider}
                        placeholder="Provider"
                        onChange={(e) =>
                          setRequirements((rows) =>
                            rows.map((row) =>
                              row.id === r.id ? { ...row, provider: e.target.value } : row
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        className="tool-form__remove"
                        aria-label={`Remove requirement ${i + 1}`}
                        onClick={() => {
                          setRequirements((rows) => rows.filter((row) => row.id !== r.id));
                          addReqBtnRef.current?.focus();
                        }}
                      >
                        <IconX size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {error !== null && (
            <p id={errId} className="field" role="alert">
              <span className="error-text">{error}</span>
            </p>
          )}

          <div className="btn-row">
            <button
              type="submit"
              className="btn"
              data-variant="primary"
              disabled={registerTool.isPending}
            >
              {registerTool.isPending ? 'Adding…' : 'Add tool'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
