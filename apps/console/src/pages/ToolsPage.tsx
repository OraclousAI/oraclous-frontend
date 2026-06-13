// Tools — the organisation's visible tool catalogue (platform built-in connectors unioned with any
// org-registered tools), from GET /api/v1/tools. Admins can import an external MCP server's tools,
// which land in a pending-approval queue (the supply-chain HITL gate, #57 / Wave 3): an imported
// tool can't run until an admin approves it — or rejects it (terminal, kept as an audit record).
import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { ApiClientError } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import { useApproveTool, useImportMcp, useRejectTool, useTools } from '../lib/tools.js';
import { useToast } from '../lib/toast.jsx';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { ToolDetailDrawer } from '../components/ToolDetailDrawer.js';
import { AddToolDrawer } from '../components/AddToolDrawer.js';
import { IconPlug, IconPlus } from '../icons/index.js';
import './catalog.css';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

export default function ToolsPage() {
  const { persona } = useDash();
  const isAdmin = persona !== 'member';
  const { tools, isLoading, isError } = useTools();
  const importMcp = useImportMcp();
  const approveTool = useApproveTool();
  const rejectTool = useRejectTool();
  const toast = useToast();

  const pending = useMemo(() => tools.filter((t) => t.status === 'pending_approval'), [tools]);
  // The runnable catalogue: active + built-ins (null status). Rejected tools are kept server-side
  // as an audit record but are not shown as usable tools.
  const active = useMemo(
    () => tools.filter((t) => t.status !== 'pending_approval' && t.status !== 'rejected'),
    [tools]
  );

  // The tool whose detail drawer is open, and the tile that opened it (focus returns there on close).
  const [openToolId, setOpenToolId] = useState<string | null>(null);
  const tileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const openTool = useMemo(
    () => (openToolId === null ? null : (active.find((t) => t.id === openToolId) ?? null)),
    [active, openToolId]
  );

  // The admin "Add a tool" form drawer, and the button that opened it (focus returns there on close).
  const [addOpen, setAddOpen] = useState(false);
  const addTriggerRef = useRef<HTMLButtonElement | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [label, setLabel] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  // One row action at a time (approve OR reject); busyKind drives which button shows progress.
  const [busy, setBusy] = useState<{ id: string; kind: 'approve' | 'reject' } | null>(null);
  const urlId = useId();
  const labelId = useId();
  const errId = useId();
  const importFormId = useId();
  // Which field a client-side validation error belongs to (so the message is associated with the
  // offending control); a server 422/502 has no single field → describe the URL field.
  const urlInvalid = formError !== null && serverUrl.trim() === '';
  const labelInvalid = formError !== null && serverUrl.trim() !== '' && label.trim() === '';
  const apiError = formError !== null && !urlInvalid && !labelInvalid;

  async function onImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const url = serverUrl.trim();
    const lbl = label.trim();
    if (url === '') {
      setFormError('Enter the MCP server URL to import from.');
      return;
    }
    if (lbl === '') {
      setFormError('Give the imported tools a label.');
      return;
    }
    try {
      const imported = await importMcp.mutateAsync({ serverUrl: url, label: lbl });
      setServerUrl('');
      setLabel('');
      setImportOpen(false);
      toast.success(
        `Imported ${imported.length} tool${imported.length === 1 ? '' : 's'} — pending approval.`
      );
    } catch (cause) {
      setFormError(messageFor(cause));
    }
  }

  async function onApprove(toolId: string) {
    if (busy !== null) return;
    setListError(null);
    setBusy({ id: toolId, kind: 'approve' });
    try {
      await approveTool.mutateAsync(toolId);
      toast.success('Tool approved.');
    } catch (cause) {
      setListError(messageFor(cause));
    } finally {
      setBusy(null);
    }
  }

  async function onReject(toolId: string) {
    if (busy !== null) return;
    setListError(null);
    setBusy({ id: toolId, kind: 'reject' });
    try {
      await rejectTool.mutateAsync(toolId);
      toast.success('Tool rejected.');
    } catch (cause) {
      setListError(messageFor(cause));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="cat-page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Catalogue</span>
          <h1>Tools</h1>
          <p className="sub">Connectors and tools available to your organisation.</p>
        </div>
        {isAdmin && (
          <div className="page-head-actions">
            <button
              type="button"
              className="btn"
              data-variant="primary"
              ref={addTriggerRef}
              aria-haspopup="dialog"
              onClick={() => setAddOpen(true)}
            >
              <IconPlus size={16} />
              Add a tool
            </button>
            <button
              type="button"
              className="btn"
              data-variant="secondary"
              onClick={() => {
                setImportOpen((v) => !v);
                setFormError(null);
              }}
              aria-expanded={importOpen}
              aria-controls={importFormId}
            >
              Import MCP server
            </button>
          </div>
        )}
      </header>

      {isAdmin && importOpen && (
        <form id={importFormId} className="card cat-import" onSubmit={onImport}>
          <div className="card-head">
            <div className="h">
              <h2>Import an MCP server</h2>
              <span className="sub">
                Its tools are imported as <strong>pending approval</strong> — review and approve
                each before it can run.
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="field-row">
              <div className="field">
                <label htmlFor={urlId}>MCP server URL</label>
                <input
                  id={urlId}
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://mcp.example.com"
                  autoComplete="off"
                  aria-invalid={urlInvalid || undefined}
                  aria-describedby={urlInvalid || apiError ? errId : undefined}
                />
              </div>
              <div className="field">
                <label htmlFor={labelId}>Label</label>
                <input
                  id={labelId}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="acme-tools"
                  autoComplete="off"
                  maxLength={64}
                  aria-invalid={labelInvalid || undefined}
                  aria-describedby={labelInvalid ? errId : undefined}
                />
                <span className="hint">A name prefix for the imported tools.</span>
              </div>
            </div>
            {formError !== null && (
              <p id={errId} className="field" role="alert">
                <span className="error-text">{formError}</span>
              </p>
            )}
            <div className="btn-row">
              <button
                type="submit"
                className="btn"
                data-variant="primary"
                disabled={importMcp.isPending}
              >
                {importMcp.isPending ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        </form>
      )}

      {listError !== null && (
        <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
          {listError}
        </p>
      )}

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : isError ? (
        <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
          Could not load the tools catalogue.
        </p>
      ) : tools.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-icon">
              <IconPlug size={24} />
            </span>
            <span className="t">No tools available yet</span>
            <span className="s">
              {isAdmin
                ? 'Platform connectors appear here as they come online — or import an MCP server above.'
                : 'Platform connectors appear here as they come online.'}
            </span>
          </div>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="card cat-pending">
              <div className="card-head">
                <div className="h">
                  <h2>Pending approval ({pending.length})</h2>
                  <span className="sub">
                    Imported tools are quarantined until an admin approves them.
                  </span>
                </div>
              </div>
              <ul className="row-list">
                {pending.map((t) => (
                  <li key={t.id}>
                    <div className="top">
                      <span className="nm">{t.name}</span>
                      <span className="cat-pending-right">
                        <span className="status-pill" data-state="warning">
                          <span className="dot" aria-hidden="true" />
                          pending
                        </span>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              className="btn"
                              data-variant="primary"
                              data-size="sm"
                              disabled={busy !== null}
                              aria-label={`Approve ${t.name}`}
                              onClick={() => onApprove(t.id)}
                            >
                              {busy?.id === t.id && busy.kind === 'approve'
                                ? 'Approving…'
                                : 'Approve'}
                            </button>
                            <button
                              type="button"
                              className="btn"
                              data-variant="danger"
                              data-size="sm"
                              disabled={busy !== null}
                              aria-label={`Reject ${t.name}`}
                              onClick={() => onReject(t.id)}
                            >
                              {busy?.id === t.id && busy.kind === 'reject'
                                ? 'Rejecting…'
                                : 'Reject'}
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                    {t.description !== null && <p className="body">{t.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {active.length > 0 && (
            <ul className="cat-grid" aria-label="Tools catalogue">
              {active.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="cat-tile"
                    aria-haspopup="dialog"
                    aria-expanded={openToolId === t.id}
                    onClick={(e) => {
                      tileTriggerRef.current = e.currentTarget;
                      setOpenToolId(t.id);
                    }}
                  >
                    <span className="top">
                      <span className="nm">{t.name}</span>
                      {t.category !== null && <span className="chip chip-sm">{t.category}</span>}
                    </span>
                    {t.description !== null && <span className="desc">{t.description}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {openTool !== null && (
        <ToolDetailDrawer
          tool={openTool}
          triggerRef={tileTriggerRef}
          onClose={() => setOpenToolId(null)}
        />
      )}

      {addOpen && <AddToolDrawer triggerRef={addTriggerRef} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
