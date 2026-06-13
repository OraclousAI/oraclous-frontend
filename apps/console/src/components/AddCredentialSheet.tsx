// Add-a-credential sheet (Connections journey, increment 2). One sheet to add any credential kind:
// a model key (BYOM preset or custom OpenAI-compatible endpoint), an API key, or a connection string,
// via POST /credentials. Model keys carry the BYOM sentinel tool_id (so the agent builder's model
// dropdown finds them by provider); standalone API key / connection-string credentials carry the
// unscoped sentinel and are matched to a tool by provider when attached later. The secret is only ever
// SENT on create — it is never stored, displayed, or read back (§1.5). Reuses the drawer chrome +
// useDrawerA11y (focus trap, Esc, scroll-lock, focus-restore to the trigger).
import { useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ApiClientError } from '@oraclous/api-client';
import {
  MODEL_CREDENTIAL_TOOL_ID,
  UNSCOPED_CREDENTIAL_TOOL_ID,
  useCreateCredential,
} from '../lib/credentials.js';
import { useToast } from '../lib/toast.jsx';
import { useDrawerA11y } from './shell/useDrawerA11y.js';
import { IconX } from '../icons/index.js';

type Kind = 'model' | 'api_key' | 'connection_string';
type ModelProvider = 'openrouter' | 'openai' | 'custom';

const KINDS: ReadonlyArray<{ value: Kind; label: string }> = [
  { value: 'model', label: 'Model key (BYOM)' },
  { value: 'api_key', label: 'API key' },
  { value: 'connection_string', label: 'Connection string' },
];
const MODEL_PROVIDERS: ReadonlyArray<{ value: ModelProvider; label: string }> = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)' },
];

// A custom label becomes the credential's provider and the model binding's first segment, so it must
// be a clean binding segment.
function labelSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function looksLikeUrl(s: string): boolean {
  return /^https?:\/\/.+/i.test(s.trim());
}
function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

export function AddCredentialSheet({
  userId,
  triggerRef,
  onClose,
}: {
  userId: string;
  // The button that opened the sheet — focus returns to it on close.
  triggerRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const kindId = useId();
  const modelProviderId = useId();
  const labelFieldId = useId();
  const customHintId = useId();
  const baseUrlId = useId();
  const providerId = useId();
  const providerHintId = useId();
  const nameId = useId();
  const secretId = useId();
  const errId = useId();
  const create = useCreateCredential();
  const toast = useToast();
  useDrawerA11y({ open: true, drawerRef: panelRef, triggerRef, onClose });

  const [kind, setKind] = useState<Kind>('model');
  const [modelProvider, setModelProvider] = useState<ModelProvider>('openrouter');
  const [customLabel, setCustomLabel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [provider, setProvider] = useState('');
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isModel = kind === 'model';
  const isCustomModel = isModel && modelProvider === 'custom';
  // The provider sent: a model preset, the slugged custom label, or the typed provider for a tool cred.
  const providerValue = isModel
    ? isCustomModel
      ? labelSlug(customLabel)
      : modelProvider
    : provider.trim();
  const secretLabel = kind === 'connection_string' ? 'Connection string' : 'API key';

  const customModelReady = !isCustomModel || (providerValue !== '' && looksLikeUrl(baseUrl));
  const providerReady = isModel || providerValue !== '';
  const canAdd =
    userId !== '' && secret.trim() !== '' && providerReady && customModelReady && !create.isPending;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!canAdd) return;
    const toolId = isModel ? MODEL_CREDENTIAL_TOOL_ID : UNSCOPED_CREDENTIAL_TOOL_ID;
    const credType = kind === 'connection_string' ? 'raw' : 'api_key';
    const secretKey = kind === 'connection_string' ? 'connection_string' : 'api_key';
    const credential: Record<string, string> = { [secretKey]: secret.trim() };
    if (isCustomModel) credential['base_url'] = baseUrl.trim();
    try {
      const added = await create.mutateAsync({
        toolId,
        userId,
        name: name.trim() !== '' ? name.trim() : `${providerValue} ${secretLabel.toLowerCase()}`,
        provider: providerValue,
        credType,
        credential,
      });
      toast.success(`Added ${added.name ?? providerValue}.`);
      setSecret(''); // Drop the secret from memory the moment it is no longer needed (§1.5).
      onClose();
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  return (
    <>
      <button
        type="button"
        className="tool-drawer__backdrop"
        aria-label="Close add credential form"
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
            <h2 id={titleId}>Add a credential</h2>
          </div>
          <button type="button" className="tool-drawer__close" aria-label="Close" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <form className="tool-drawer__body tool-form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor={kindId}>Kind</label>
            <select
              id={kindId}
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as Kind);
                setError(null);
              }}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          {isModel ? (
            <>
              <div className="field">
                <label htmlFor={modelProviderId}>Provider</label>
                <select
                  id={modelProviderId}
                  value={modelProvider}
                  onChange={(e) => {
                    setModelProvider(e.target.value as ModelProvider);
                    setError(null);
                  }}
                >
                  {MODEL_PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              {isCustomModel && (
                <>
                  <div className="field">
                    <label htmlFor={labelFieldId}>Provider label</label>
                    <input
                      id={labelFieldId}
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="my-llm"
                      autoComplete="off"
                      aria-describedby={customHintId}
                    />
                    {customLabel.trim() !== '' && (
                      <span id={customHintId} className="hint">
                        Model binding prefix: <span className="mono">{providerValue || '…'}/…</span>
                      </span>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor={baseUrlId}>Base URL</label>
                    <input
                      id={baseUrlId}
                      type="url"
                      inputMode="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://my-endpoint/v1"
                      autoComplete="off"
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="field">
              <label htmlFor={providerId}>Provider</label>
              <input
                id={providerId}
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder={kind === 'connection_string' ? 'e.g. postgresql' : 'e.g. github'}
                autoComplete="off"
                aria-describedby={providerHintId}
              />
              <span id={providerHintId} className="hint">
                Match the provider the tool expects so you can attach it later.
              </span>
            </div>
          )}

          <div className="field">
            <label htmlFor={nameId}>Name (optional)</label>
            <input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="A label for this credential"
              autoComplete="off"
              maxLength={255}
            />
          </div>

          <div className="field">
            <label htmlFor={secretId}>{secretLabel}</label>
            <input
              id={secretId}
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(e) => {
                setSecret(e.target.value);
                if (error !== null) setError(null);
              }}
              placeholder={kind === 'connection_string' ? 'postgresql://…' : 'sk-…'}
              aria-invalid={error !== null}
              aria-describedby={error !== null ? errId : undefined}
            />
          </div>

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
              disabled={!canAdd}
              aria-busy={create.isPending}
            >
              {create.isPending ? 'Adding…' : 'Add credential'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
