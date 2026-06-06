// Agents — capability instances. Create an agent from a tool in the catalogue, then open it to
// configure readiness and run it. Each agent is one configured capability instance.
import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiClientError } from '@oraclous/api-client';
import { useTools } from '../lib/tools.js';
import { useCreateInstance, useInstances } from '../lib/agents.js';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

const styles = {
  page: { display: 'grid', gap: 20, maxWidth: 820 },
  h1: { margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  card: {
    display: 'grid',
    gap: 14,
    padding: 20,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
  },
  h2: { margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' },
  field: { display: 'grid', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink, #0b1220)' },
  input: {
    flex: 1,
    minWidth: 180,
    boxSizing: 'border-box',
    padding: '9px 12px',
    fontSize: 14,
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
  },
  select: {
    padding: '9px 12px',
    fontSize: 14,
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    minWidth: 200,
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
    whiteSpace: 'nowrap',
  },
  busy: { opacity: 0.6, cursor: 'default' },
  muted: { margin: 0, fontSize: 13.5, color: 'var(--ink, #0b1220)' },
  error: {
    margin: 0,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--ink, #0b1220)',
    background: 'var(--error-bg, #fbeae8)',
    border: '1px solid var(--error, #c8412c)',
    borderRadius: 8,
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  },
  itemCard: {
    display: 'grid',
    gap: 6,
    padding: 16,
    minWidth: 0,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 10,
    textDecoration: 'none',
    color: 'inherit',
  },
  itemTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ink, #0b1220)',
    overflowWrap: 'break-word',
  },
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
  itemMeta: { margin: 0, fontSize: 12, color: 'var(--ink, #0b1220)', opacity: 0.8 },
} satisfies Record<string, CSSProperties>;

export default function AgentsPage() {
  const { tools } = useTools();
  const { instances, isLoading } = useInstances();
  const createInstance = useCreateInstance();
  const navigate = useNavigate();

  const toolId = useId();
  const nameId = useId();
  const [capabilityId, setCapabilityId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toolName = (id: string): string => tools.find((t) => t.id === id)?.name ?? 'tool';

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (capabilityId === '') return;
    try {
      const instance = await createInstance.mutateAsync({ capabilityId, name: name.trim() });
      setName('');
      setCapabilityId('');
      navigate(`/app/agents/${instance.id}`);
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Agents</h1>

      <section style={styles.card} aria-label="Create an agent">
        <h2 style={styles.h2}>Create an agent</h2>
        <p style={styles.muted}>Instantiate a tool from the catalogue, then open it to run it.</p>
        <form style={styles.row} onSubmit={onCreate}>
          <div style={styles.field}>
            <label htmlFor={toolId} style={styles.label}>
              Tool
            </label>
            <select
              id={toolId}
              value={capabilityId}
              onChange={(e) => setCapabilityId(e.target.value)}
              required
              style={styles.select}
            >
              <option value="">Select a tool…</option>
              {tools.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ ...styles.field, flex: 1, minWidth: 180 }}>
            <label htmlFor={nameId} style={styles.label}>
              Name
            </label>
            <input
              id={nameId}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production DB reader"
              style={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={createInstance.isPending || capabilityId === '' || name.trim() === ''}
            aria-busy={createInstance.isPending}
            style={
              createInstance.isPending ? { ...styles.primary, ...styles.busy } : styles.primary
            }
          >
            {createInstance.isPending ? 'Creating…' : 'Create agent'}
          </button>
        </form>
        {error !== null && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}
      </section>

      <section style={styles.card} aria-label="Your agents">
        <h2 style={styles.h2}>Your agents</h2>
        {isLoading ? (
          <p style={styles.muted} role="status">
            Loading…
          </p>
        ) : instances.length === 0 ? (
          <p style={styles.muted}>No agents yet — create one above to run a tool.</p>
        ) : (
          <ul style={styles.list} aria-label="Agents">
            {instances.map((inst) => (
              <li key={inst.id}>
                <Link to={`/app/agents/${inst.id}`} style={styles.itemCard}>
                  <div style={styles.itemTop}>
                    <span style={styles.itemName}>{inst.name}</span>
                    <span style={styles.badge} aria-label={`status: ${inst.status}`}>
                      {inst.status}
                    </span>
                  </div>
                  <p style={styles.itemMeta}>
                    {toolName(inst.capabilityId)} · {inst.executionCount} run
                    {inst.executionCount === 1 ? '' : 's'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
