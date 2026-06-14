// Shared protocol for the popup-based OAuth connect flow (#140). The connect popup and its opener
// are the SAME origin — the popup is our own /app/oauth/connect/:provider/callback route — so the
// result travels back via window.postMessage scoped to window.location.origin. Nothing is persisted
// and nothing crosses origins (Gate 2 safe). Keeping the popup open means the originating surface
// (the agent builder, a tool instance, Connections) never navigates, so in-progress work survives.

export const CONNECT_MESSAGE_SOURCE = 'oraclous-oauth-connect';

export interface ConnectMessage {
  readonly source: typeof CONNECT_MESSAGE_SOURCE;
  readonly ok: boolean;
  readonly provider: string;
  readonly credentialId?: string;
  // For ok:false only — true when the user declined at the provider (or closed the flow), so the
  // opener can stay quiet instead of showing an error.
  readonly cancelled?: boolean;
}

// What a connect resolves with:
// - connected: the popup completed; credentialId is the new broker credential.
// - cancelled: the user closed/denied the popup, or it never reported back within the ceiling — no
//   error to show.
// - failed: the popup reported a genuine completion failure — surface an error.
// - redirected: the popup was blocked, so we fell back to a full-page redirect and the opener is
//   navigating away (callers do nothing).
export type ConnectResult =
  | { readonly status: 'connected'; readonly provider: string; readonly credentialId: string }
  | { readonly status: 'cancelled' }
  | { readonly status: 'failed' }
  | { readonly status: 'redirected' };

export function isConnectMessage(data: unknown): data is ConnectMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { source?: unknown }).source === CONNECT_MESSAGE_SOURCE &&
    typeof (data as { ok?: unknown }).ok === 'boolean'
  );
}

// True when this document is running inside a popup we opened (so the callback should report its
// result back to the opener and close, rather than navigate).
export function isConnectPopup(): boolean {
  return typeof window !== 'undefined' && window.opener !== null && window.opener !== window;
}

// Post the connect outcome to the opener (same origin) and close the popup.
export function reportConnectResultAndClose(result: Omit<ConnectMessage, 'source'>): void {
  try {
    window.opener?.postMessage(
      { source: CONNECT_MESSAGE_SOURCE, ...result },
      window.location.origin
    );
  } finally {
    window.close();
  }
}
