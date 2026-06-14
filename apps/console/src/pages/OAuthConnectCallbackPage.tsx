// OAuth connect callback (Connections increment 5; popup-aware since #140). The provider redirects
// here with ?code&state after the user authorises a *connect* (not a login). We complete the
// exchange — POST /oauth/{provider}/connect/complete — which lands the provider token as a broker
// credential server-side; the secret never touches the FE (§1.5). Unlike the login callback this
// issues NO session, so it is an AUTHENTICATED route under /app (the bearer is required to complete
// the connect). The exchange runs exactly once (code/state are single-use; a ref guards StrictMode's
// double-invoke).
//
// Two arrival modes:
// - POPUP (the default, #140): connect opened us in a popup. We report the result to the opener via
//   postMessage (same origin) and close — the originating surface stays mounted and refreshes there.
// - FULL PAGE (popup-blocked fallback): we refresh the credential set and navigate to Connections.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../lib/api.jsx';
import { invalidateCredentialSet } from '../lib/credentials.js';
import { isConnectPopup, reportConnectResultAndClose } from '../lib/oauth-connect.js';

export default function OAuthConnectCallbackPage() {
  const { provider = '' } = useParams<{ provider: string }>();
  const [params] = useSearchParams();
  const { auth } = useApi();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const popup = isConnectPopup();
    // cancelled = the user declined at the provider (vs a genuine failure) — the opener stays quiet.
    const fail = (message: string, cancelled: boolean) => {
      if (popup) reportConnectResultAndClose({ ok: false, provider, cancelled });
      else setError(message);
    };

    const code = params.get('code');
    const state = params.get('state');
    if (params.get('error') !== null) {
      fail('The connection was cancelled or denied.', true);
      return;
    }
    if (code === null || state === null) {
      fail('This connection link is missing its authorization response.', false);
      return;
    }

    void (async () => {
      try {
        const { credentialId } = await auth.oauthConnectComplete(provider, code, state);
        if (popup) {
          // The opener refreshes its own credential set on receiving this and stays put.
          reportConnectResultAndClose({ ok: true, provider, credentialId });
          return;
        }
        // The credential now exists server-side; refresh the credential/provider panels.
        invalidateCredentialSet(queryClient);
        navigate('/app/connections', { replace: true });
      } catch {
        fail('Couldn’t complete the connection. Please try again.', false);
      }
    })();
  }, [auth, navigate, params, provider, queryClient]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
        alignItems: 'flex-start',
        padding: 'var(--sp-6) 0',
      }}
    >
      {error === null ? (
        <p role="status" style={{ margin: 0, color: 'var(--mute)', fontSize: 13 }}>
          Completing connection…
        </p>
      ) : (
        <>
          <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
          <button
            type="button"
            className="btn"
            data-variant="secondary"
            data-size="sm"
            onClick={() => navigate('/app/connections', { replace: true })}
          >
            Back to connections
          </button>
        </>
      )}
    </div>
  );
}
