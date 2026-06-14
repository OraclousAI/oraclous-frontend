// OAuth connect callback (Connections increment 5). The provider redirects here with ?code&state
// after the user authorises a *connect* (not a login). We complete the exchange — POST
// /oauth/{provider}/connect/complete — which lands the provider token as a broker credential
// server-side; the secret never touches the FE (§1.5). Unlike the login callback this issues NO
// session, so it is an AUTHENTICATED route under /app (the bearer is required to complete the
// connect). The exchange runs exactly once (code/state are single-use; a ref guards StrictMode's
// double-invoke). On success we refresh the credential set and return to Connections.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../lib/api.jsx';
import { invalidateCredentialSet } from '../lib/credentials.js';

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

    const code = params.get('code');
    const state = params.get('state');
    if (params.get('error') !== null) {
      setError('The connection was cancelled or denied.');
      return;
    }
    if (code === null || state === null) {
      setError('This connection link is missing its authorization response.');
      return;
    }

    void (async () => {
      try {
        await auth.oauthConnectComplete(provider, code, state);
        // The credential now exists server-side; refresh the credential/provider panels.
        invalidateCredentialSet(queryClient);
        navigate('/app/connections', { replace: true });
      } catch {
        setError('Couldn’t complete the connection. Please try again.');
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
