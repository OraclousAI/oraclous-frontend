// One configured tool instance in the detail drawer's "Set up" list (Tools — increments 3, 4 & 5).
// Shows the instance name + status, a CredentialSlot for each credential the instance requires, and a
// "Test connection" action (increment 5) that runs the readiness check and shows a healthy (mint dot)
// or error state with the reason. Attaching a credential maps credential_type → credential id via
// configure-credentials; the instance flips to READY once every required type is mapped. Secrets live
// only in CredentialSlot's in-memory state, in-flight to POST /credentials — never persisted (§1.5).
// OAuth requirements are out of scope here (the connect flow is the Connections journey).
import { useId, useState } from 'react';
import type { Credential, Instance, Tool } from '@oraclous/api-client';
import { useConfigureCredentials, useValidation } from '../lib/agents.js';
import { credentialFormForRequirement } from '../lib/credentials.js';
import { useToast } from '../lib/toast.jsx';
import { CredentialSlot } from './CredentialSlot.js';

// "CONFIGURATION_REQUIRED" → "configuration required" for display.
function humanizeStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, ' ');
}

export function ToolInstanceRow({
  instance,
  tool,
  userId,
  candidates,
}: {
  instance: Instance;
  tool: Tool;
  userId: string;
  // The signed-in user's credentials (metadata only) — filtered per requirement for the picker.
  candidates: readonly Credential[];
}) {
  const configure = useConfigureCredentials(instance.id);
  const toast = useToast();
  const credBaseId = useId();
  // Readiness check is on demand only (enabled: false); the button calls refetch().
  const {
    report,
    isFetching: testing,
    isError: testError,
    refetch: runCheck,
  } = useValidation(instance.id, false);
  const [tested, setTested] = useState(false);

  async function testConnection() {
    setTested(true);
    try {
      await runCheck();
    } catch {
      // A failed check is reflected in the query's error state (shown in the result region below).
    }
  }

  function providerFor(type: string): string {
    return tool.credentialRequirements.find((r) => r.type === type)?.provider ?? type;
  }

  // Send the full merged mapping so attaching one credential never drops the others.
  async function attach(type: string, credentialId: string | null) {
    const mappings: Record<string, string> = { ...instance.credentialMappings };
    if (credentialId !== null) mappings[type] = credentialId;
    else delete mappings[type];
    try {
      await configure.mutateAsync(mappings);
      toast.success(
        credentialId !== null
          ? `Credential configured for ${instance.name}.`
          : `Credential removed from ${instance.name}.`
      );
    } catch {
      toast.error('Could not update the credential. Please try again.');
    }
  }

  return (
    <li className="tool-inst">
      <div className="tool-inst__head">
        <span className="tool-inst__name">{instance.name}</span>
        <span className="chip chip-sm">{humanizeStatus(instance.status)}</span>
      </div>

      <div className="tool-inst__test">
        <button
          type="button"
          className="btn"
          data-variant="secondary"
          data-size="sm"
          onClick={() => void testConnection()}
          disabled={testing}
        >
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        {/* The result is announced when it settles; `aria-busy` keeps the prior result visible during
            a re-test so the region never flashes empty. */}
        <div
          className="tool-inst__test-result"
          aria-live="polite"
          role="status"
          aria-busy={testing || undefined}
        >
          {tested && testError && (
            <span className="status-pill" data-state="error">
              <span className="dot" aria-hidden="true" />
              Could not run the check
            </span>
          )}
          {tested && !testError && report !== null && report.isReady && (
            <span className="status-pill" data-state="active">
              <span className="dot" aria-hidden="true" />
              Healthy
            </span>
          )}
          {tested && !testError && report !== null && !report.isReady && (
            <>
              <span className="status-pill" data-state="error">
                <span className="dot" aria-hidden="true" />
                Not ready
              </span>
              {report.errors.map((e, i) => (
                <span key={i} className="tool-inst__test-reason">
                  {e.message}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {instance.requiredCredentials.length > 0 && (
        <ul className="tool-inst__creds">
          {instance.requiredCredentials.map((type) => {
            const form = credentialFormForRequirement(type);
            const mapped = instance.credentialMappings[type] ?? null;
            const provider = providerFor(type);
            const labelId = `${credBaseId}-${type}`;
            return (
              <li key={type} className="tool-inst__cred" role="group" aria-labelledby={labelId}>
                <div className="tool-inst__cred-head">
                  <span id={labelId} className="tool-inst__cred-label">
                    {form.label}
                  </span>
                  {mapped !== null && <span className="chip chip-sm">credential configured</span>}
                </div>
                {form.manual ? (
                  <CredentialSlot
                    label={form.label}
                    provider={provider}
                    credType={form.credType}
                    secretKey={form.secretKey}
                    toolId={tool.id}
                    userId={userId}
                    candidates={candidates.filter(
                      (c) =>
                        c.credType === form.credType &&
                        (c.toolId === tool.id || c.provider === provider)
                    )}
                    value={mapped}
                    onChange={(credentialId) => void attach(type, credentialId)}
                    manual={form.manual}
                  />
                ) : (
                  <p className="tool-drawer__muted">
                    This credential is connected through OAuth, which is coming soon.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
