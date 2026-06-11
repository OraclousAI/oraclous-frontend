// Eurail onboarder dev bridge.
//
// DEV-ONLY. The onboarder chat POSTs a question (with prior turns) to the same-origin
// `/eurail/api/chat` endpoint, which under `astro dev` is served by the marketing app's
// dev-only Vite middleware — it grounds the turn in the analysis corpus and streams the
// reply back token-by-token from a local OpenAI-compatible LLM.
//
// This is NOT an Application Gateway call — it is a local dev contrivance. The production
// onboarder will stream from a real gateway chat endpoint via the typed transport used by
// the other sub-clients in this package; when that lands, this module is swapped for it.
// It lives here (rather than in feature code) because all HTTP must originate from
// @oraclous/api-client (CI Gate 1) — keeping the eventual swap to the gateway a one-file change.

export interface ChatTurn {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface OnboarderQuestion {
  readonly id: string;
  readonly text: string;
  /**
   * The conversation this turn belongs to (one session file per conversation). Generated
   * in-memory by the client for a new conversation (never persisted in the browser — Gate 2).
   * The dev bridge appends BOTH this user turn and the full assistant reply to
   * `.eurail-sessions/<sessionId>.json` after the stream completes.
   */
  readonly sessionId: string;
  /**
   * Prior conversation turns (oldest first), excluding the in-flight `text` turn.
   * The dev bridge prepends a corpus-grounding system message and appends `text` as the
   * final user turn before calling the local model. Optional; defaults to none.
   */
  readonly history?: readonly ChatTurn[];
}

const ONBOARDER_BRIDGE_PATH = '/eurail/api/chat';
const ONBOARDER_SESSIONS_PATH = '/eurail/api/chat/sessions';

/**
 * POST a question to the dev onboarder bridge and resolve with the raw response stream
 * (token-by-token `text/plain`). Throws if the bridge is unreachable or returns no body —
 * the caller renders its "bridge offline / dev test mode" state in that case (which is the
 * expected state in the static production build, where the bridge middleware is absent).
 */
export async function streamOnboarder({
  sessionId,
  id,
  text,
  history = [],
}: OnboarderQuestion): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(ONBOARDER_BRIDGE_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin', // carry the HttpOnly session cookie the gate set
    body: JSON.stringify({ sessionId, id, text, history }),
  });
  if (!res.ok || !res.body) throw new Error(`onboarder bridge unavailable (${res.status})`);
  return res.body;
}

// ── History read-side (issues #2 & #4) ───────────────────────────────────────────────────
// Conversations are persisted server-side by the dev middleware (Gate 2 forbids browser storage);
// these helpers read them back for the history sidebar. Same-origin dev endpoints, housed here so
// all HTTP stays inside @oraclous/api-client (Gate 1). Both resolve to an empty/null result when
// the bridge is absent (the static production build) — the UI just shows no history.

/** One persisted turn in a session file. */
export interface SessionTurn {
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly at: number;
}

/** A full conversation transcript (the on-disk session file shape). */
export interface SessionFile {
  readonly id: string;
  readonly title: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly turns: readonly SessionTurn[];
}

/** A sidebar list row — the lightweight projection the list endpoint returns. */
export interface SessionSummary {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: number;
  readonly turnCount: number;
  readonly preview: string;
}

/** DEV-ONLY. List the signed-in user's past conversations (most-recent-first) for the sidebar. */
export async function fetchSessions(): Promise<readonly SessionSummary[]> {
  try {
    const res = await fetch(ONBOARDER_SESSIONS_PATH, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { sessions?: SessionSummary[] };
    return Array.isArray(body?.sessions) ? body.sessions : [];
  } catch {
    return [];
  }
}

/** DEV-ONLY. Load one of the signed-in user's transcripts by id, or null when absent/unreachable. */
export async function fetchSession(sessionId: string): Promise<SessionFile | null> {
  try {
    const res = await fetch(`${ONBOARDER_SESSIONS_PATH}/${encodeURIComponent(sessionId)}`, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    return (await res.json()) as SessionFile;
  } catch {
    return null;
  }
}

// ── Access gate (dev-only @eurail.com email verification) ────────────────────────────────
// The dev middleware emails a 6-digit code and, on verify, sets an HttpOnly session cookie that
// gates the chat + history API. These helpers drive the gate UI; the cookie itself is never
// readable by JS (HttpOnly) — it rides automatically on the same-origin calls above. Real
// deployment enforcement is edge-auth / the Application Gateway; this is the dev demo of the flow.

const ONBOARDER_AUTH_PATH = '/eurail/api/auth';

/** The signed-in identity, or null when no valid session cookie is present. */
export async function getOnboarderIdentity(): Promise<{ email: string } | null> {
  try {
    const res = await fetch(`${ONBOARDER_AUTH_PATH}/me`, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    return (await res.json()) as { email: string };
  } catch {
    return null;
  }
}

/** Request a verification code be emailed to an `@eurail.com` address. Returns {ok} or an error message. */
export async function requestOnboarderCode(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${ONBOARDER_AUTH_PATH}/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return res.ok ? { ok: true } : { ok: false, error: body.error ?? 'Could not send a code.' };
  } catch {
    return { ok: false, error: 'The verification service is unreachable.' };
  }
}

/** Verify a code; on success the server sets the session cookie. Returns the email or an error. */
export async function verifyOnboarderCode(
  email: string,
  code: string
): Promise<{ email?: string; error?: string }> {
  try {
    const res = await fetch(`${ONBOARDER_AUTH_PATH}/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, code }),
    });
    const body = (await res.json().catch(() => ({}))) as { email?: string; error?: string };
    if (res.ok) return body.email ? { email: body.email } : { error: 'Verification failed.' };
    return { error: body.error ?? 'Invalid code.' };
  } catch {
    return { error: 'The verification service is unreachable.' };
  }
}

/** Clear the session cookie (sign out). */
export async function onboarderLogout(): Promise<void> {
  try {
    await fetch(`${ONBOARDER_AUTH_PATH}/logout`, { method: 'POST', credentials: 'same-origin' });
  } catch {
    /* best-effort */
  }
}
