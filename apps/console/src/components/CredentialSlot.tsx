// A credential picker for one slot (a model's BYOM key, or one of a tool's credential
// requirements): choose an existing credential or add a new one inline. The secret is only ever
// SENT on create — it never re-enters the UI, so when editing an agent whose slot is already
// wired, the slot keeps the wired id selected without ever reading the secret back.
import { useState } from 'react';
import type { CredType, Credential } from '@oraclous/api-client';
import { useCreateCredential } from '../lib/credentials.js';

export interface CredentialSlotProps {
  readonly label: string;
  readonly provider: string;
  readonly credType: CredType;
  // The credential payload key the broker stores the secret under (e.g. api_key, connection_string).
  readonly secretKey: string;
  // Scope tag on create (a tool's registry id, or the model sentinel).
  readonly toolId: string;
  readonly userId: string;
  readonly candidates: readonly Credential[];
  readonly value: string | null;
  readonly onChange: (credentialId: string | null) => void;
  // false → the secret comes from an OAuth flow, so inline manual entry isn't offered.
  readonly manual?: boolean;
}

export function CredentialSlot({
  label,
  provider,
  credType,
  secretKey,
  toolId,
  userId,
  candidates,
  value,
  onChange,
  manual = true,
}: CredentialSlotProps) {
  const create = useCreateCredential();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);

  // A wired id we can't match to a listed candidate (editing — the secret is unreadable) must
  // still render as the current selection rather than silently resetting to "none".
  const valueListed = value !== null && candidates.some((c) => c.id === value);

  async function onAdd() {
    const trimmed = secret.trim();
    if (trimmed === '' || create.isPending) return;
    setError(null);
    try {
      const cred = await create.mutateAsync({
        toolId,
        userId,
        name: name.trim() !== '' ? name.trim() : `${provider} ${label.toLowerCase()}`,
        provider,
        credType,
        credential: { [secretKey]: trimmed },
      });
      onChange(cred.id);
      setAdding(false);
      setSecret('');
      setName('');
    } catch {
      setError('Couldn’t save the credential. Please try again.');
    }
  }

  return (
    <div className="cred-slot">
      <div className="cred-pick">
        <select
          aria-label={`${label} credential`}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">— none —</option>
          {value !== null && !valueListed && (
            <option value={value}>current key (…{value.slice(-6)})</option>
          )}
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? `${c.provider} · ${c.credType}`}
            </option>
          ))}
        </select>
        {manual && !adding && (
          <button
            type="button"
            className="btn"
            data-variant="ghost"
            data-size="sm"
            onClick={() => setAdding(true)}
          >
            + Add key
          </button>
        )}
      </div>

      {manual && adding && (
        <div className="cred-add">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name (optional)"
            aria-label={`${label} name`}
          />
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={label}
            aria-label={label}
            autoComplete="off"
          />
          <button
            type="button"
            className="btn"
            data-variant="secondary"
            data-size="sm"
            onClick={() => void onAdd()}
            disabled={create.isPending || secret.trim() === ''}
          >
            {create.isPending ? 'Saving…' : 'Save key'}
          </button>
          <button
            type="button"
            className="btn"
            data-variant="ghost"
            data-size="sm"
            onClick={() => {
              setAdding(false);
              setSecret('');
              setError(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {!manual && (
        <p className="cred-note">
          This {provider} credential is connected through an OAuth flow — add it from the tool
          instance page, then select it here.
        </p>
      )}

      {error !== null && (
        <p role="alert" className="cred-error">
          {error}
        </p>
      )}
    </div>
  );
}
