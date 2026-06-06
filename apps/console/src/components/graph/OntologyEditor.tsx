// Ontology editor for a graph — view/edit the allowed entity labels + the enforcement mode
// (GET/PUT /api/v1/graphs/{id}/ontology). Constrains what entity types ingestion writes into the
// graph. Rendered as a section on the workspace detail page.
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import type { OntologyMode } from '@oraclous/api-client';
import { useOntology, useSetOntology } from '../../lib/graphs.js';
import { useToast } from '../../lib/toast.jsx';

const MODES: readonly OntologyMode[] = ['open', 'strict', 'coerce'];
const MODE_HELP: Record<OntologyMode, string> = {
  open: 'Any entity label is allowed.',
  strict: 'Only allowed labels are kept; other entities are dropped.',
  coerce: 'Unknown labels are mapped onto the closest allowed label.',
};

function isMode(v: string): v is OntologyMode {
  return (MODES as readonly string[]).includes(v);
}

export function OntologyEditor({ graphId }: { graphId: string }) {
  const { ontology, isLoading, isError } = useOntology(graphId);
  const setOntology = useSetOntology(graphId);
  const toast = useToast();

  const [labels, setLabels] = useState<readonly string[]>([]);
  const [mode, setMode] = useState<OntologyMode>('open');
  const [newLabel, setNewLabel] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the editor once from the loaded ontology.
  useEffect(() => {
    if (ontology !== null && !hydrated) {
      setLabels([...ontology.allowedLabels]);
      setMode(isMode(ontology.mode) ? ontology.mode : 'open');
      setHydrated(true);
    }
  }, [ontology, hydrated]);

  function addLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const v = newLabel.trim();
    setNewLabel('');
    if (v === '' || labels.includes(v)) return;
    setLabels((l) => [...l, v]);
  }

  function removeLabel(v: string) {
    setLabels((l) => l.filter((x) => x !== v));
  }

  async function onSave() {
    try {
      await setOntology.mutateAsync({ allowedLabels: [...labels], mode });
      toast.success('Ontology saved.');
    } catch {
      toast.error('Could not save the ontology.');
    }
  }

  const dirty =
    hydrated &&
    ontology !== null &&
    (mode !== ontology.mode ||
      labels.length !== ontology.allowedLabels.length ||
      labels.some((l, i) => l !== ontology.allowedLabels[i]));

  return (
    <section style={styles.card} aria-label="Ontology">
      <h2 style={styles.h2}>Ontology</h2>
      <p style={styles.muted}>Constrain the entity types that ingestion writes into this graph.</p>

      {isError ? (
        <p role="alert" style={styles.error}>
          Could not load the ontology.
        </p>
      ) : isLoading || !hydrated ? (
        <p style={styles.muted} role="status">
          Loading…
        </p>
      ) : (
        <>
          <div style={styles.field}>
            <span style={styles.label}>Mode</span>
            <div style={styles.modes} role="radiogroup" aria-label="Ontology mode">
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  style={mode === m ? { ...styles.modeBtn, ...styles.modeBtnOn } : styles.modeBtn}
                >
                  {m}
                </button>
              ))}
            </div>
            <span style={styles.help}>{MODE_HELP[mode]}</span>
          </div>

          <div style={styles.field}>
            <span style={styles.label}>Allowed labels</span>
            {labels.length === 0 ? (
              <span style={styles.help}>
                No labels yet — with mode “open”, any entity type is allowed.
              </span>
            ) : (
              <ul style={styles.chips}>
                {labels.map((l) => (
                  <li key={l} style={styles.chip}>
                    <span>{l}</span>
                    <button
                      type="button"
                      onClick={() => removeLabel(l)}
                      aria-label={`Remove ${l}`}
                      style={styles.chipX}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addLabel} style={styles.addRow}>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add a label (e.g. Person)"
                aria-label="Add an allowed label"
                style={styles.input}
              />
              <button type="submit" disabled={newLabel.trim() === ''} style={styles.secondary}>
                Add
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || setOntology.isPending}
            style={
              !dirty || setOntology.isPending
                ? { ...styles.primary, ...styles.busy }
                : styles.primary
            }
          >
            {setOntology.isPending ? 'Saving…' : 'Save ontology'}
          </button>
        </>
      )}
    </section>
  );
}

const styles = {
  card: {
    display: 'grid',
    gap: 12,
    padding: 20,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
  },
  h2: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  muted: { margin: 0, fontSize: 13.5, color: 'var(--mute, #65686f)' },
  field: { display: 'grid', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink, #0b1220)' },
  help: { fontSize: 12.5, color: 'var(--mute, #65686f)' },
  error: {
    margin: 0,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--ink, #0b1220)',
    background: 'var(--error-bg, #fbeae8)',
    border: '1px solid var(--error, #c8412c)',
    borderRadius: 8,
  },
  modes: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  modeBtn: {
    padding: '6px 12px',
    fontSize: 13,
    textTransform: 'capitalize',
    color: 'var(--ink, #0b1220)',
    background: 'transparent',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  modeBtnOn: {
    background: 'var(--ink, #0b1220)',
    color: 'var(--paper, #f4f4f2)',
    borderColor: 'var(--ink, #0b1220)',
  },
  chips: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 6px 4px 10px',
    fontSize: 12.5,
    color: 'var(--ink, #0b1220)',
    background: 'var(--paper-soft, #eceae5)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 999,
  },
  chipX: {
    appearance: 'none',
    border: 'none',
    background: 'transparent',
    color: 'var(--mute, #65686f)',
    fontSize: 15,
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
    width: 18,
    height: 18,
  },
  addRow: { display: 'flex', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    minWidth: 160,
    boxSizing: 'border-box',
    padding: '8px 12px',
    fontSize: 14,
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
  },
  secondary: {
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--ink, #0b1220)',
    background: 'transparent',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
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
} satisfies Record<string, CSSProperties>;
