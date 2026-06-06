// Agent detail — one capability instance: readiness (validate), run it (input_data JSON), and the
// result. /execute returns 201 for both success and failure, so we branch on the execution status.
import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiClientError, type CredType } from '@oraclous/api-client';
import {
  useConfigureCredentials,
  useCreateCredential,
  useExecuteInstance,
  useInstance,
  useValidation,
} from '../lib/agents.js';
import { useMe } from '../lib/session.js';
import { useTools } from '../lib/tools.js';

interface RequirementForm {
  readonly credType: CredType;
  readonly secretKey: string;
  readonly label: string;
  // false = the credential needs an OAuth connection, so manual secret entry isn't offered.
  readonly manual: boolean;
}

function formForRequirement(type: string): RequirementForm {
  if (type === 'connection_string')
    return {
      credType: 'raw',
      secretKey: 'connection_string',
      label: 'Connection string',
      manual: true,
    };
  if (type === 'api_key')
    return { credType: 'api_key', secretKey: 'api_key', label: 'API key', manual: true };
  if (type === 'oauth_token')
    return { credType: 'oauth', secretKey: 'token', label: 'OAuth token', manual: false };
  return { credType: 'api_key', secretKey: 'value', label: 'Secret', manual: true };
}

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

const styles = {
  page: { display: 'grid', gap: 18, maxWidth: 820 },
  back: {
    fontSize: 13,
    color: 'var(--ink, #0b1220)',
    textDecoration: 'none',
    width: 'fit-content',
  },
  header: { display: 'grid', gap: 6 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  h1: { margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--ink, #0b1220)',
    background: 'var(--paper-soft, #eceae5)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 999,
    padding: '2px 8px',
    whiteSpace: 'nowrap',
  },
  card: {
    display: 'grid',
    gap: 12,
    padding: 20,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
  },
  h2: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  muted: { margin: 0, fontSize: 13.5, color: 'var(--ink, #0b1220)' },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink, #0b1220)' },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 96,
    padding: '10px 12px',
    fontSize: 13,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    resize: 'vertical',
  },
  primary: {
    padding: '9px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--paper, #f4f4f2)',
    background: 'var(--ink, #0b1220)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    width: 'fit-content',
  },
  busy: { opacity: 0.6, cursor: 'default' },
  error: {
    margin: 0,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--ink, #0b1220)',
    background: 'var(--error-bg, #fbeae8)',
    border: '1px solid var(--error, #c8412c)',
    borderRadius: 8,
  },
  okPanel: {
    display: 'grid',
    gap: 8,
    padding: '12px 14px',
    background: 'var(--success-bg, #e7f3ec)',
    border: '1px solid var(--success, #2e8b57)',
    borderRadius: 8,
  },
  failPanel: {
    display: 'grid',
    gap: 6,
    padding: '12px 14px',
    background: 'var(--error-bg, #fbeae8)',
    border: '1px solid var(--error, #c8412c)',
    borderRadius: 8,
  },
  panelTitle: { fontSize: 13, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  pre: {
    margin: 0,
    padding: '10px 12px',
    fontSize: 12.5,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
  },
  checks: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  check: { fontSize: 12, color: 'var(--ink, #0b1220)' },
  metaMono: {
    margin: 0,
    fontSize: 12,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--ink, #0b1220)',
    opacity: 0.8,
  },
  reqRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  reqLabel: { fontSize: 13, color: 'var(--ink, #0b1220)' },
  okText: { fontSize: 13, fontWeight: 600, color: 'var(--success, #2e8b57)' },
  reqForm: { display: 'grid', gap: 6 },
  reqInputRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  input: {
    flex: 1,
    minWidth: 200,
    boxSizing: 'border-box',
    padding: '9px 12px',
    fontSize: 14,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
  },
  secondary: {
    padding: '7px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--ink, #0b1220)',
    background: 'transparent',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, CSSProperties>;

const DEFAULT_INPUT = '{\n  "operation": "list_tables"\n}';

function RequirementRow({
  type,
  provider,
  mapped,
  onConnect,
}: {
  type: string;
  provider: string;
  mapped: boolean;
  onConnect: (secret: string) => Promise<void>;
}) {
  const form = formForRequirement(type);
  const inputId = useId();
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (secret.trim() === '') return;
    setBusy(true);
    setError(null);
    try {
      await onConnect(secret);
      setSecret('');
      setReplacing(false);
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusy(false);
    }
  }

  if (mapped && !replacing) {
    return (
      <div style={styles.reqRow}>
        <span style={styles.reqLabel}>
          {type} · {provider}
        </span>
        <span style={styles.okText}>✓ configured</span>
        <button type="button" onClick={() => setReplacing(true)} style={styles.secondary}>
          Replace
        </button>
      </div>
    );
  }

  if (!form.manual) {
    return (
      <div style={styles.reqRow}>
        <span style={styles.reqLabel}>
          {type} · {provider}
        </span>
        <span style={styles.muted}>Needs an OAuth connection (coming soon).</span>
      </div>
    );
  }

  return (
    <form style={styles.reqForm} onSubmit={onSubmit}>
      <label htmlFor={inputId} style={styles.label}>
        {form.label} for {provider}
      </label>
      <div style={styles.reqInputRow}>
        <input
          id={inputId}
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={form.label}
          style={styles.input}
        />
        <button
          type="submit"
          disabled={busy || secret.trim() === ''}
          aria-busy={busy}
          style={busy ? { ...styles.primary, ...styles.busy } : styles.primary}
        >
          {busy ? 'Connecting…' : 'Connect'}
        </button>
      </div>
      {error !== null && (
        <p role="alert" style={styles.error}>
          {error}
        </p>
      )}
    </form>
  );
}

export default function AgentDetailPage() {
  const { instanceId = '' } = useParams<{ instanceId: string }>();
  const { instance, isLoading, isError } = useInstance(instanceId);
  const { report, isError: reportError } = useValidation(instanceId, instance !== null);
  const execute = useExecuteInstance(instanceId);
  const { tools, isLoading: toolsLoading } = useTools();
  const { principal } = useMe();
  const createCredential = useCreateCredential();
  const configure = useConfigureCredentials(instanceId);

  const tool =
    instance !== null ? (tools.find((t) => t.id === instance.capabilityId) ?? null) : null;

  async function connectRequirement(type: string, provider: string, secret: string): Promise<void> {
    if (instance === null) return;
    const userId = principal?.id;
    if (userId === undefined || userId === '') throw new Error('You are not signed in.');
    const form = formForRequirement(type);
    const credential = await createCredential.mutateAsync({
      toolId: instance.capabilityId,
      userId,
      name: `${provider} for ${instance.name}`,
      provider,
      credType: form.credType,
      credential: { [form.secretKey]: secret },
    });
    await configure.mutateAsync({ [type]: credential.id });
  }

  const [input, setInput] = useState(DEFAULT_INPUT);
  const [inputError, setInputError] = useState<string | null>(null);

  function onRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInputError(null);
    execute.reset(); // clear any prior result so it doesn't linger during the new run
    let parsed: Record<string, unknown>;
    try {
      const trimmed = input.trim();
      const value: unknown = trimmed === '' ? {} : JSON.parse(trimmed);
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error('not an object');
      }
      parsed = value as Record<string, unknown>;
    } catch {
      setInputError('Enter a valid JSON object, e.g. {"operation": "list_tables"}');
      return;
    }
    execute.mutate(parsed);
  }

  const result = execute.data ?? null;

  return (
    <div style={styles.page}>
      <Link to="/app/agents" style={styles.back}>
        ← Agents
      </Link>

      {isLoading ? (
        <p style={styles.muted} role="status">
          Loading…
        </p>
      ) : isError || instance === null ? (
        <p style={styles.error} role="alert">
          This agent could not be found.
        </p>
      ) : (
        <>
          <header style={styles.header}>
            <div style={styles.titleRow}>
              <h1 style={styles.h1}>{instance.name}</h1>
              <span style={styles.badge} aria-label={`status: ${instance.status}`}>
                {instance.status}
              </span>
            </div>
            {instance.description !== null && instance.description !== '' && (
              <p style={styles.muted}>{instance.description}</p>
            )}
          </header>

          <section style={styles.card} aria-label="Readiness">
            <h2 style={styles.h2}>Readiness</h2>
            {reportError ? (
              <p style={styles.muted} role="alert">
                Couldn&rsquo;t check readiness.
              </p>
            ) : report === null ? (
              <p style={styles.muted} role="status">
                Checking…
              </p>
            ) : report.isReady ? (
              <p style={styles.muted}>Ready to run.</p>
            ) : (
              <>
                <div style={styles.checks}>
                  {Object.entries(report.checks).map(([k, v]) => (
                    <span key={k} style={styles.check}>
                      {k}: {v}
                    </span>
                  ))}
                </div>
                {report.errors.map((e, i) => (
                  <p key={i} style={styles.muted}>
                    {e.message}
                  </p>
                ))}
                {instance.requiredCredentials.length > 0 && (
                  <p style={styles.muted}>
                    Needs credentials: {instance.requiredCredentials.join(', ')} — credential
                    configuration is coming to the Credentials page.
                  </p>
                )}
              </>
            )}
          </section>

          {instance.requiredCredentials.length > 0 && (
            <section style={styles.card} aria-label="Credentials">
              <h2 style={styles.h2}>Credentials</h2>
              <p style={styles.muted}>
                This tool needs credentials to run. Connect one per requirement; the agent becomes
                ready once they&rsquo;re configured.
              </p>
              {toolsLoading ? (
                <p style={styles.muted} role="status">
                  Loading…
                </p>
              ) : (
                instance.requiredCredentials.map((type) => {
                  const provider =
                    tool?.credentialRequirements.find((r) => r.type === type)?.provider ?? type;
                  return (
                    <RequirementRow
                      key={type}
                      type={type}
                      provider={provider}
                      mapped={Boolean(instance.credentialMappings[type])}
                      onConnect={(secret) => connectRequirement(type, provider, secret)}
                    />
                  );
                })
              )}
            </section>
          )}

          <section style={styles.card} aria-label="Run">
            <h2 style={styles.h2}>Run</h2>
            <form style={{ display: 'grid', gap: 10 }} onSubmit={onRun}>
              <label htmlFor="agent-input" style={styles.label}>
                Input (JSON)
              </label>
              <textarea
                id="agent-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                style={styles.textarea}
              />
              {inputError !== null && (
                <p role="alert" style={styles.error}>
                  {inputError}
                </p>
              )}
              <button
                type="submit"
                disabled={execute.isPending}
                aria-busy={execute.isPending}
                style={execute.isPending ? { ...styles.primary, ...styles.busy } : styles.primary}
              >
                {execute.isPending ? 'Running…' : 'Run'}
              </button>
            </form>

            {execute.isError && (
              <p role="alert" style={styles.error}>
                {messageFor(execute.error)}
              </p>
            )}

            {result !== null && (
              <div role="status">
                {result.status === 'SUCCESS' ? (
                  <div style={styles.okPanel}>
                    <span style={styles.panelTitle}>
                      Success
                      {result.processingTimeMs !== null ? ` · ${result.processingTimeMs} ms` : ''}
                    </span>
                    <pre style={styles.pre}>{JSON.stringify(result.outputData ?? {}, null, 2)}</pre>
                  </div>
                ) : (
                  <div style={styles.failPanel}>
                    <span style={styles.panelTitle}>
                      {result.status}
                      {result.errorType !== null ? ` · ${result.errorType}` : ''}
                    </span>
                    <p style={styles.metaMono}>
                      {result.errorMessage ?? 'The run did not return output.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
