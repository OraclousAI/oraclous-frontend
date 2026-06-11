// @ts-check
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile, readdir, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHmac, createHash, randomInt, randomBytes, timingSafeEqual } from 'node:crypto';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';

/**
 * Load dev-only onboarder config from `apps/marketing/.env` (gitignored) without adding a dotenv
 * dependency — a minimal KEY=VALUE reader. These values flow into the dev chat middleware only:
 * nothing here is exposed to the client bundle (no `PUBLIC_` prefix) and the static `astro build`
 * omits the middleware entirely, so the API key never ships to the browser or production.
 */
function loadOnboarderEnv() {
  /** @type {Record<string, string>} */
  const out = {};
  try {
    const txt = readFileSync(new URL('./.env', import.meta.url), 'utf8');
    for (const rawLine of txt.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
  } catch {
    /* no .env file — fall back to process.env / defaults */
  }
  return out;
}
const ONBOARDER_ENV = loadOnboarderEnv();
const onboarderEnv = (/** @type {string} */ name, /** @type {string} */ fallback) =>
  process.env[name] ?? ONBOARDER_ENV[name] ?? fallback;

/**
 * Dev-only onboarder bridge. Under `astro dev` this Vite middleware streams the Eurail
 * onboarder reply straight from a local OpenAI-compatible LLM (e.g. a uvicorn proxy in
 * front of Claude), grounded in the analysis corpus. It translates the upstream SSE
 * `delta.content` stream into the SAME plain-text protocol the browser already speaks
 * (`%%END%%` terminator, optional model-emitted `%%CHIPS: a | b | c%%`), so the React
 * island (`ChatPage.tsx`) needs no parser change.
 *
 * Wire contract (browser → bridge): POST JSON
 *   { id: string, text: string, history: { role:'user'|'assistant', content:string }[] }
 * Bridge → LLM: OpenAI chat-completions, messages =
 *   [ {role:'system', content:<grounding>}, ...history, {role:'user', content:text} ], stream:true.
 * Bridge → browser: the concatenated `delta.content` tokens as `text/plain`, then `%%END%%` once.
 *
 * This runs ONLY in the dev server. The static `astro build` does not include it, so in
 * production the onboarder shows its built-in "bridge offline / dev test mode" state until
 * a real Application Gateway chat endpoint is wired. No new runtime dep, no SSR adapter —
 * uses Node global `fetch`/`AbortController`/`TextDecoder`. Dev/test only — never a prod backend.
 *
 * Config (env or `apps/marketing/.env`, with defaults):
 *   EURAIL_ONBOARDER_URL     default https://openrouter.ai/api/v1/chat/completions
 *   EURAIL_ONBOARDER_MODEL   default anthropic/claude-sonnet-4.6
 *   EURAIL_ONBOARDER_API_KEY bearer token for the endpoint (e.g. an OpenRouter key) — dev-only, never committed
 *
 * @returns {import('astro').AstroIntegration}
 */
function eurailChatBridge() {
  const LLM_URL = onboarderEnv('EURAIL_ONBOARDER_URL', 'https://openrouter.ai/api/v1/chat/completions');
  const LLM_MODEL = onboarderEnv('EURAIL_ONBOARDER_MODEL', 'anthropic/claude-sonnet-4.6');
  const LLM_API_KEY = onboarderEnv('EURAIL_ONBOARDER_API_KEY', '');
  const UPSTREAM_TIMEOUT_MS = 120_000; // hard ceiling against a wedged endpoint
  const TERM = '%%END%%'; // the bridge's exclusive terminator — must be the only one on the wire
  const MAX_TURNS = 24;
  const MAX_HISTORY_CHARS = 24_000;

  // --- cartographer (grounded-diagram agent) tuning -----------------------------------
  // After the onboarder's prose streams, if it asked for a picture via a %%DIAGRAM: intent%%
  // marker, a SEPARATE non-streaming LLM call (same endpoint/key/model) authors one DiagramSpec
  // from the intent + corpus + a bounded evidence digest; a deterministic verifier then drops any
  // figure it can't ground before we emit a ```diagram block. Best-effort + time-boxed: any failure
  // here just means no picture, never a broken reply.
  const CARTOGRAPHER_TIMEOUT_MS = 25_000; // ceiling for the diagram authoring call (a complex
  // diagram can take ~15-20s); bounded so a wedged cartographer can't hold the stream open forever.
  const CARTOGRAPHER_MAX_TOKENS = 1500; // a DiagramSpec is small; bound the non-streaming reply
  const DIGEST_EVIDENCE_MAX = 36; // evidence records (id+claim+label+confidence) handed to the agent
  const DIAGRAM_FENCE_LANG = 'diagram'; // RichMessage renders ```diagram blocks via <Diagram/>

  const EURAIL_DIR = new URL('./src/eurail/', import.meta.url);
  const GROUND_FILES = [
    'findings',
    'ladder',
    'opportunities',
    'engagement',
    'domains',
    'signals',
    'phasing',
    'documents',
  ];

  const safeId = (/** @type {unknown} */ s) =>
    typeof s === 'string' && /^[a-z0-9-]{6,40}$/.test(s);

  // ── DEV-ONLY EMAIL GATE (@eurail.com) ──────────────────────────────────────────────
  // Gates the chat + history API behind an emailed-code verification and scopes sessions per user.
  // The session is an HttpOnly cookie (NOT localStorage — Gate 2 clean; the correct home for a
  // session credential). HONEST SCOPE: enforced by THIS dev middleware only. The static production
  // build ships no middleware, so a real deployment needs edge-auth (e.g. Cloudflare Access on the
  // @eurail.com domain) or the Application Gateway. What it does guarantee in dev: the chat/history
  // API + the OpenRouter key are unreachable without a verified @eurail.com session, and each user's
  // conversations are isolated.
  const AUTH_COOKIE = 'eurail_session';
  const CODE_TTL_MS = 10 * 60_000; // a code is valid 10 minutes
  const SESSION_TTL_MS = 24 * 3_600_000; // a verified session lasts 24h
  const RESEND_MIN_INTERVAL_MS = 30_000; // ≥30s between code requests for one email
  const MAX_CODE_ATTEMPTS = 5;
  const AUTH_SECRET = onboarderEnv('EURAIL_AUTH_SECRET', '') || randomBytes(32).toString('hex');
  const EMAIL_API_KEY = onboarderEnv('EURAIL_EMAIL_API_KEY', '');
  const EMAIL_FROM = onboarderEnv('EURAIL_EMAIL_FROM', 'support@oraclous.com');
  // SMTP (e.g. Gmail with an app password) — preferred over Resend when configured.
  const SMTP_HOST = onboarderEnv('SMTP_HOST', '');
  const SMTP_PORT = Number(onboarderEnv('SMTP_PORT', '587')) || 587;
  const SMTP_USER = onboarderEnv('SMTP_USERNAME', '');
  const SMTP_PASS = onboarderEnv('SMTP_PASSWORD', '');
  const SMTP_FROM = onboarderEnv('SMTP_FROM', '') || EMAIL_FROM;

  const normEmail = (/** @type {unknown} */ e) => String(e ?? '').trim().toLowerCase();
  // Local part restricted to a practical RFC-5321 dot-atom allow-list (defence-in-depth; CRLF, spaces,
  // a second @, and off-domain suffixes are already excluded by the anchored @eurail.com$).
  // Allowed logins: any @eurail.com address, plus admin test addresses (dev-only — lets Reza receive a
  // real code at an inbox he owns, since @eurail.com inboxes aren't his). Remove before any real use.
  const ADMIN_TEST_EMAILS = ['r.jahankohan@gmail.com'];
  const isAllowedEmail = (/** @type {unknown} */ e) => {
    const n = normEmail(e);
    return /^[a-z0-9._%+-]{1,64}@eurail\.com$/i.test(n) || ADMIN_TEST_EMAILS.includes(n);
  };
  const MAX_PENDING_CODES = 1000; // bound the dev code store
  const emailHash = (/** @type {string} */ e) => createHash('sha256').update(normEmail(e)).digest('hex').slice(0, 24);

  // code store: email(lower) -> { code, exp, attempts, lastSent }
  /** @type {Map<string, { code: string, exp: number, attempts: number, lastSent: number }>} */
  const codeStore = new Map();
  const genCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

  // session token: base64url(JSON{e,x}).base64url(hmac). HMAC-SHA256 over the payload with AUTH_SECRET.
  const signToken = (/** @type {string} */ email) => {
    const body = Buffer.from(JSON.stringify({ e: normEmail(email), x: Date.now() + SESSION_TTL_MS })).toString('base64url');
    const sig = createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
    return `${body}.${sig}`;
  };
  const verifyToken = (/** @type {unknown} */ token) => {
    if (typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    let payload;
    try {
      payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      return null;
    }
    if (!payload || typeof payload.e !== 'string' || typeof payload.x !== 'number') return null;
    if (Date.now() > payload.x) return null; // expired
    if (!isAllowedEmail(payload.e)) return null; // tampered / domain changed
    return normEmail(payload.e);
  };

  const parseCookies = (/** @type {unknown} */ header) => {
    /** @type {Record<string, string>} */
    const out = {};
    for (const part of String(header || '').split(';')) {
      const i = part.indexOf('=');
      if (i === -1) continue;
      out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
    return out;
  };
  const authedEmail = (/** @type {any} */ req) => verifyToken(parseCookies(req.headers?.cookie)[AUTH_COOKIE]);
  // No `Secure` in dev (http://localhost won't send it); add Secure behind https in production.
  const setSessionCookie = (/** @type {any} */ res, /** @type {string} */ token) =>
    res.setHeader('Set-Cookie', `${AUTH_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
  const clearSessionCookie = (/** @type {any} */ res) =>
    res.setHeader('Set-Cookie', `${AUTH_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);

  // Read + parse a JSON request body (bounded). Returns null on bad/oversized input.
  const readJsonBody = async (/** @type {any} */ req) => {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 8_192) return null; // auth/chat bodies are tiny; cap to refuse abuse
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  // Email the 6-digit code. Priority: SMTP (Gmail app-password) → Resend → dev-console fallback (so
  // the flow stays testable with no email service). Lazily build one SMTP transport (dev-only dep).
  /** @type {any} */
  let mailer = null;
  const getMailer = async () => {
    if (mailer) return mailer;
    // @ts-ignore — nodemailer ships no bundled types; this runs only in the dev bridge.
    const nodemailer = await import('nodemailer');
    mailer = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Fail fast so a slow/blocked SMTP never stalls the gate — fall back to console quickly.
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
    return mailer;
  };
  const sendCode = async (/** @type {string} */ email, /** @type {string} */ code) => {
    // Dev bridge (only runs under `astro dev`): always surface the code in the server console so
    // testing never needs an inbox — then deliver it for real below.
    console.log(`\x1b[35m[eurail-auth] CODE\x1b[0m for ${email}: ${code}`);
    const subject = 'Your Oraclous access code';
    const text = `Your access code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      try {
        const m = await getMailer();
        await m.sendMail({ from: SMTP_FROM, to: email, subject, text });
        console.log(`\x1b[35m[eurail-auth]\x1b[0m emailed ${email} via SMTP`);
      } catch (err) {
        console.error('[eurail-auth] SMTP send failed (code already shown above):', /** @type {any} */ (err)?.message || err);
      }
      return;
    }
    if (EMAIL_API_KEY) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { authorization: `Bearer ${EMAIL_API_KEY}`, 'content-type': 'application/json' },
          body: JSON.stringify({ from: EMAIL_FROM, to: email, subject, text }),
        });
        if (!r.ok) console.error(`[eurail-auth] Resend send failed (${r.status}) for ${email}`);
      } catch (err) {
        console.error('[eurail-auth] Resend error:', /** @type {any} */ (err)?.message || err);
      }
    }
  };

  // --- session persistence (dev-only, on disk; issues #2 & #4) -----------------------
  // One JSON file per conversation under apps/marketing/.eurail-sessions/<sessionId>.json
  // (gitignored): { id, title, createdAt, updatedAt, turns: { role, content, at }[] }.
  // The SAME /^[a-z0-9-]{6,40}$/ id rule that guards the LLM `id` guards the filename, so a
  // crafted sessionId can't escape the dir (no `.`/`/`/`\` passes the regex). All writes are
  // best-effort — a persistence failure is logged, never allowed to break the chat stream.
  // Per-user storage: one directory per verified user (keyed by a hash of their email), so a user's
  // conversations are isolated and the list/get endpoints only ever read their own directory. `uid`
  // is always emailHash(authedEmail) — never client-supplied — so it can't be used to reach another
  // user's files, and it's hex (no `.`/`/`) so it can't escape the sessions root.
  const SESSIONS_DIR = new URL('./.eurail-sessions/', import.meta.url);
  const userDir = (/** @type {string} */ uid) => new URL(`${uid}/`, SESSIONS_DIR);
  const sessionFileUrl = (/** @type {string} */ uid, /** @type {string} */ sid) => new URL(`${sid}.json`, userDir(uid));
  const TITLE_MAX = 80;
  const makeTitle = (/** @type {string} */ firstUserText) => {
    const t = (firstUserText || '').replace(/\s+/g, ' ').trim();
    if (!t) return 'New conversation';
    return t.length > TITLE_MAX ? `${t.slice(0, TITLE_MAX - 1)}…` : t;
  };
  const readSession = async (/** @type {string} */ uid, /** @type {string} */ sid) => {
    try {
      const json = JSON.parse(await readFile(sessionFileUrl(uid, sid), 'utf8'));
      if (!json || typeof json !== 'object' || !Array.isArray(json.turns)) return null;
      return json;
    } catch {
      return null; // ENOENT or bad JSON — treat as "no such session"
    }
  };
  // Append the user turn + the assistant reply, creating the file (titled from the first user
  // turn) if needed. Temp-file + rename so a crash mid-write can't leave half-written JSON.
  const appendTurns = async (
    /** @type {string} */ uid,
    /** @type {string} */ sid,
    /** @type {string} */ userText,
    /** @type {string} */ assistantText,
  ) => {
    try {
      await mkdir(userDir(uid), { recursive: true });
      const now = Date.now();
      const existing = await readSession(uid, sid);
      const session = existing ?? { id: sid, title: makeTitle(userText), createdAt: now, turns: [] };
      session.turns.push({ role: 'user', content: userText, at: now });
      session.turns.push({ role: 'assistant', content: assistantText, at: Date.now() });
      session.updatedAt = Date.now();
      if (!session.title) {
        session.title = makeTitle(session.turns.find((/** @type {any} */ t) => t.role === 'user')?.content ?? '');
      }
      const tmp = new URL(`${sid}.json.tmp`, userDir(uid));
      await writeFile(tmp, JSON.stringify(session, null, 2), 'utf8');
      await rename(fileURLToPath(tmp), fileURLToPath(sessionFileUrl(uid, sid)));
    } catch (err) {
      console.error('[eurail-chat] session persist failed:', /** @type {any} */ (err)?.message || err);
    }
  };

  // Build the grounding system prompt once: the persona/instructions template with the small
  // corpus JSON files injected at <<CORPUS_JSON>>. Read lazily at dev-server start (dev-only).
  /** @type {string | null} */
  let systemPromptCache = null;
  const buildSystemPrompt = () => {
    if (systemPromptCache) return systemPromptCache;
    let template = 'You are the Eurail onboarder. Answer only from the analysis corpus.\n<<CORPUS_JSON>>';
    try {
      template = readFileSync(new URL('onboarder.system.md', EURAIL_DIR), 'utf8');
    } catch {
      /* fall back to the minimal template above */
    }
    /** @type {Record<string, unknown>} */
    const corpus = {};
    for (const name of GROUND_FILES) {
      try {
        corpus[name] = JSON.parse(readFileSync(new URL(`corpus/${name}.json`, EURAIL_DIR), 'utf8'));
      } catch {
        /* a missing corpus file is non-fatal — ground on whatever is present */
      }
    }
    systemPromptCache = template.replace(
      '<<CORPUS_JSON>>',
      `ANALYSIS CORPUS (authoritative JSON):\n${JSON.stringify(corpus)}`,
    );
    return systemPromptCache;
  };

  // ── Cartographer: the grounded free-form diagram agent ───────────────────────────────
  // A SEPARATE, non-streaming LLM call that — given the onboarder's one-line %%DIAGRAM intent%% —
  // authors a single DiagramSpec from the corpus + a bounded evidence digest. A deterministic
  // verifier (verifyDiagram, supplied by the diagram-DSL piece) then drops every figure it can't
  // ground before we emit the ```diagram block. Everything below is best-effort: a load/parse/HTTP
  // failure means no picture, never a broken reply.

  // The whole corpus, parsed once and cached (findings always go in the digest — small; the rest is
  // available to the agent as the authoritative JSON it reasons over). Mirrors buildSystemPrompt's
  // loader but keeps the structured object (not the stringified prompt) so we can build the digest.
  /** @type {Record<string, any> | null} */
  let corpusCache = null;
  const loadCorpus = () => {
    if (corpusCache) return corpusCache;
    /** @type {Record<string, any>} */
    const corpus = {};
    for (const name of GROUND_FILES) {
      try {
        corpus[name] = JSON.parse(readFileSync(new URL(`corpus/${name}.json`, EURAIL_DIR), 'utf8'));
      } catch {
        /* a missing corpus file is non-fatal */
      }
    }
    corpusCache = corpus;
    return corpus;
  };

  // The 596-record evidence ledger (raw/evidence.json), parsed once. Big — never sent whole; the
  // digest selector picks the ~36 records most relevant to an intent. Failure → empty (findings-only
  // grounding still works).
  /** @type {any[] | null} */
  let evidenceCache = null;
  const loadEvidence = () => {
    if (evidenceCache) return evidenceCache;
    try {
      const j = JSON.parse(readFileSync(new URL('corpus/raw/evidence.json', EURAIL_DIR), 'utf8'));
      evidenceCache = Array.isArray(j) ? j : [];
    } catch {
      evidenceCache = [];
    }
    return evidenceCache;
  };

  // The cartographer's own system prompt (cartographer.system.md), read once. Fallback is a terse
  // inline brief so a missing file still yields a contract-shaped spec.
  /** @type {string | null} */
  let cartographerPromptCache = null;
  const loadCartographerPrompt = () => {
    if (cartographerPromptCache) return cartographerPromptCache;
    let txt =
      'You are the Cartographer. Output ONLY one DiagramSpec JSON object illustrating the intent. ' +
      'Every figure goes in a node fact:{value,cite} citing a finding "F<n>" or an evidence id; ' +
      'never a bare number in a label. Choose layout from layered|flow|timeline|matrix|network. ' +
      'Output only the JSON object, no prose, no fences.';
    try {
      txt = readFileSync(new URL('cartographer.system.md', EURAIL_DIR), 'utf8');
    } catch {
      /* fall back to the inline brief */
    }
    cartographerPromptCache = txt;
    return cartographerPromptCache;
  };

  // Score an evidence record against the intent's keywords: a hit in claim/raw/dimensions/label.
  // Cheap token overlap (no deps) — enough to surface the ~36 records the figures likely live in.
  const STOP = new Set(
    'the a an of to in on for and or vs from with that this it its is are be by at as into about over our their out who you your show illustrate diagram picture across between'.split(
      ' ',
    ),
  );
  const keywordsOf = (/** @type {string} */ intent) =>
    Array.from(
      new Set(
        (intent || '')
          .toLowerCase()
          .replace(/[^a-z0-9% ]+/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length >= 3 && !STOP.has(w)),
      ),
    );

  // Build the bounded grounding digest for the agent: ALL findings (small, the headline figures),
  // plus the top-N evidence records by keyword match (id + claim + label + confidence only, to
  // bound tokens). The agent cites F<n> or an ev-id strictly from what this returns.
  const buildDigest = (/** @type {string} */ intent) => {
    const corpus = loadCorpus();
    const findings = Array.isArray(corpus.findings) ? corpus.findings : [];
    const findingDigest = findings.map((/** @type {any} */ f) => ({
      cite: `F${f.number}`,
      domain: f.domain,
      headline: f.headline,
      detail: f.detail,
    }));

    const kws = keywordsOf(intent);
    const evidence = loadEvidence();
    /** @type {{ rec: any, score: number }[]} */
    const scored = [];
    for (const r of evidence) {
      if (!r || typeof r.id !== 'string') continue;
      const hay = `${r.claim || ''} ${r.raw || ''} ${(r.dimensions || []).join(' ')} ${
        r.ai_adoption_relevance || ''
      }`.toLowerCase();
      let score = 0;
      for (const k of kws) if (hay.includes(k)) score += 1;
      // A figure-bearing record (has a digit) is slightly preferred — diagrams want numbers.
      if (score > 0 && /\d/.test(r.claim || r.raw || '')) score += 0.5;
      if (score > 0) scored.push({ rec: r, score });
    }
    scored.sort((a, b) => b.score - a.score);
    const evidenceDigest = scored.slice(0, DIGEST_EVIDENCE_MAX).map(({ rec }) => ({
      cite: rec.id,
      claim: rec.claim,
      label: rec.label,
      confidence: rec.confidence,
    }));

    return { findings: findingDigest, evidence: evidenceDigest, corpus };
  };

  // Tolerant first-JSON-object extractor: the agent is told to emit only `{...}`, but strip any
  // stray ```json fences / prose and pull the first balanced object. Returns the parsed value or null.
  const extractFirstJsonObject = (/** @type {string} */ s) => {
    if (typeof s !== 'string') return null;
    const start = s.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < s.length; i++) {
      const c = s[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(s.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  };

  // Run the cartographer: digest → non-streaming OpenRouter chat → first JSON object → spec | null.
  // Time-boxed by its own AbortController (independent of the prose stream). Any failure → null.
  const runCartographer = async (/** @type {string} */ intent) => {
    const brief = (intent || '').replace(/\s+/g, ' ').trim();
    if (!brief || !LLM_API_KEY) return null; // no key → can't author (dev offline) → no picture

    const { findings, evidence, corpus } = buildDigest(brief);
    const userContent =
      `INTENT (what to illustrate):\n${brief}\n\n` +
      `FINDINGS (cite as "F<n>") — value text lives in headline+detail:\n${JSON.stringify(findings)}\n\n` +
      `EVIDENCE DIGEST (cite by id) — value text lives in claim:\n${JSON.stringify(evidence)}\n\n` +
      `FULL CORPUS (authoritative JSON for structure/labels):\n${JSON.stringify(corpus)}\n\n` +
      `Author ONE DiagramSpec illustrating the intent. Output ONLY the JSON object.`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CARTOGRAPHER_TIMEOUT_MS);
    try {
      const resp = await fetch(LLM_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(LLM_API_KEY ? { authorization: `Bearer ${LLM_API_KEY}` } : {}),
          'HTTP-Referer': 'https://oraclous.com',
          'X-Title': 'Eurail × Oraclous Cartographer',
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: 'system', content: loadCartographerPrompt() },
            { role: 'user', content: userContent },
          ],
          stream: false,
          temperature: 0,
          max_tokens: CARTOGRAPHER_MAX_TOKENS,
        }),
        signal: ctrl.signal,
      });
      if (!resp.ok) {
        console.error(`[eurail-chat] cartographer upstream ${resp.status}`);
        return null;
      }
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') return null;
      return extractFirstJsonObject(content);
    } catch (err) {
      console.error('[eurail-chat] cartographer failed:', /** @type {any} */ (err)?.message || err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  // The deterministic verifier is supplied by the diagram-DSL piece as an ESM module. Resolve it
  // lazily + tolerantly: until that module lands, a missing verifier simply means no diagram (the
  // grounding guarantee is code-enforced, so we NEVER render an unverified spec — no verifier, no
  // render). Contract: verifyDiagram(spec, { corpus, evidence }) → a verified DiagramSpec (with each
  // surviving node.fact stamped { value, cite, confidence, strength } and every ungrounded fact /
  // bare-number label dropped) or null when nothing survives.
  /** @type {((spec: any, ctx: any) => any) | null | undefined} */
  let verifyDiagramFn;
  const getVerifier = async () => {
    if (verifyDiagramFn !== undefined) return verifyDiagramFn;
    try {
      const mod = await import('./src/eurail/chat/diagram/verifier.mjs');
      const fn = mod?.verifyDiagram;
      verifyDiagramFn = typeof fn === 'function' ? fn : null;
    } catch {
      verifyDiagramFn = null; // module not present yet — fail closed (no verifier → no diagram)
    }
    return verifyDiagramFn;
  };

  // End-to-end: intent → cartographer → verifier → a serialised verified spec (or null). Wrapped so
  // any failure in the chain yields null — the caller then simply emits no diagram block.
  const buildVerifiedDiagram = async (/** @type {string} */ intent) => {
    try {
      const verify = await getVerifier();
      if (!verify) return null; // fail closed: no deterministic verifier ⇒ no grounded diagram
      const spec = await runCartographer(intent);
      if (!spec || typeof spec !== 'object') return null;
      // verifyDiagram(spec, corpus) reads corpus.findings + corpus.evidence off the 2nd arg.
      const verified = verify(spec, { findings: loadCorpus().findings, evidence: loadEvidence() });
      if (!verified || !Array.isArray(verified.nodes) || verified.nodes.length === 0) return null;
      return verified;
    } catch (err) {
      console.error('[eurail-chat] diagram build failed:', /** @type {any} */ (err)?.message || err);
      return null;
    }
  };

  // Coerce client-supplied history into clean OpenAI turns, then cap it (most-recent-first
  // within a char budget) so a runaway client can't send an unbounded body to the LLM.
  const sanitizeHistory = (/** @type {unknown} */ h) => {
    if (!Array.isArray(h)) return [];
    /** @type {{ role: 'user' | 'assistant', content: string }[]} */
    const out = [];
    for (const m of h) {
      if (!m || typeof m !== 'object') continue;
      const role = /** @type {any} */ (m).role;
      const content = /** @type {any} */ (m).content;
      if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
        out.push({ role, content });
      }
    }
    let trimmed = out.slice(-MAX_TURNS);
    let total = trimmed.reduce((n, m) => n + m.content.length, 0);
    while (trimmed.length > 1 && total > MAX_HISTORY_CHARS) {
      total -= trimmed[0].content.length;
      trimmed = trimmed.slice(1);
    }
    return trimmed;
  };

  return {
    name: 'eurail-chat-bridge',
    hooks: {
      'astro:server:setup': ({ server }) => {
        const systemPrompt = buildSystemPrompt();

        server.middlewares.use('/eurail/api/chat', async (req, res, next) => {
          if (req.method !== 'POST') return next();

          // --- gate: a verified @eurail.com session is required to chat ----------------
          const email = authedEmail(req);
          if (!email) {
            res.statusCode = 401;
            res.setHeader('content-type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ error: 'unauthorized' }));
          }
          const uid = emailHash(email); // per-user session storage key (server-derived, never client)

          // --- read + validate the request body ---------------------------------------
          const body = await readJsonBody(req);
          if (body === null) {
            res.statusCode = 400;
            return res.end('bad json');
          }
          const { sessionId, id, text, history } = body ?? {};
          if (!safeId(id) || typeof text !== 'string' || !text.trim()) {
            res.statusCode = 400;
            return res.end('bad request');
          }
          // sessionId is optional on the wire; when present it must pass the same id rule before
          // it ever touches the filesystem.
          const sid = safeId(sessionId) ? sessionId : null;

          // Log the question on dev-server stdout (handy when watching a session); truncated.
          const q = text.length > 200 ? `${text.slice(0, 200)}…` : text;
          console.log(`\x1b[36m[eurail-chat] Q:\x1b[0m ${id} :: ${q}`);

          const messages = [
            { role: 'system', content: systemPrompt },
            ...sanitizeHistory(history),
            { role: 'user', content: text },
          ];

          // --- open the plain-text streaming response to the browser ------------------
          res.statusCode = 200;
          res.setHeader('content-type', 'text/plain; charset=utf-8');
          res.setHeader('cache-control', 'no-store');
          res.setHeader('x-accel-buffering', 'no');

          // Terminator written exactly once, by whichever path finishes first.
          let ended = false;
          /** @param {string} [tail] trusted middleware note written before the terminator */
          const finish = (tail) => {
            if (ended) return;
            ended = true;
            if (tail && !res.writableEnded) res.write(tail);
            if (!res.writableEnded) res.write(TERM);
            if (!res.writableEnded) res.end();
          };

          // Streamed-text writer that holds the terminator contract: strips any literal
          // %%END%% the model might emit (the only %%END%% on the wire is the one `finish`
          // appends), with a small tail-hold so a marker split across deltas (`%%EN`|`D%%`)
          // can't slip through. The model is told never to write %%END%%; this is defence.
          let pending = '';
          let gotAnyToken = false;
          // Accumulates the reply exactly as the browser receives it (terminator stripped, %%CHIPS%%
          // intact) so the persisted transcript == what was streamed. The client runs parseReply on
          // load, so chips are reconstructed and never shown as a literal marker. The ```diagram block
          // (appended after the stream completes) is added here too, so reloaded history shows the
          // picture without re-running the cartographer.
          let assistantReply = '';
          // First %%DIAGRAM: intent%% the onboarder emits this turn — stripped from the wire (like
          // %%END%%) and held for the cartographer to run AFTER the prose finishes. At most one per
          // turn (the onboarder is told never to emit more than one); later markers are ignored.
          /** @type {string | null} */
          let diagramIntent = null;
          // Opening prefix we tail-hold on so a marker split across deltas (`%%DIAG`|`RAM: …`) is
          // never emitted as visible text before we can strip it. The longest hold candidate must
          // cover both this prefix and TERM.
          const DIAGRAM_OPEN = '%%DIAGRAM:';
          // Strip every COMPLETE `%%DIAGRAM: …%%` marker from a buffer, capturing the first intent.
          // Markers are single-line by contract, so the intent runs to the closing `%%` (or end of
          // line). Returns the buffer with all complete markers removed.
          const scrubDiagramMarkers = (/** @type {string} */ s) => {
            let out = '';
            let i = 0;
            for (;;) {
              const at = s.indexOf(DIAGRAM_OPEN, i);
              if (at === -1) {
                out += s.slice(i);
                break;
              }
              // Find the marker's close: the next `%%` after the intent, bounded to this line.
              const afterOpen = at + DIAGRAM_OPEN.length;
              const nl = s.indexOf('\n', afterOpen);
              const lineEnd = nl === -1 ? s.length : nl;
              const close = s.indexOf('%%', afterOpen);
              if (close === -1 || close > lineEnd) {
                // No complete close on this line yet — leave from `at` onward in the buffer (the
                // tail-hold below keeps it pending until the close arrives or the stream flushes).
                out += s.slice(i, at);
                return { text: out, rest: s.slice(at) };
              }
              const intent = s.slice(afterOpen, close).trim();
              if (diagramIntent === null && intent) diagramIntent = intent;
              out += s.slice(i, at);
              i = close + 2; // past the closing `%%`
            }
            return { text: out, rest: '' };
          };
          const emit = (/** @type {string} */ s) => {
            if (s && !res.writableEnded) res.write(s);
          };
          // Longest tail to hold so neither TERM nor an opening %%DIAGRAM: marker is emitted split.
          const HOLD_MAX = Math.max(TERM.length, DIAGRAM_OPEN.length) - 1;
          const tailHold = (/** @type {string} */ buf) => {
            for (let k = Math.min(HOLD_MAX, buf.length); k > 0; k--) {
              const tail = buf.slice(buf.length - k);
              if (TERM.startsWith(tail) || DIAGRAM_OPEN.startsWith(tail)) return k;
            }
            return 0;
          };
          const writeModel = (/** @type {string} */ delta) => {
            pending += delta;
            if (pending.includes(TERM)) pending = pending.split(TERM).join('');
            // Strip any complete %%DIAGRAM:…%% marker (capturing its intent). `rest` is an in-flight
            // OPEN marker whose close hasn't arrived — hold it WHOLE (never emit a half-marker); only
            // the clean `text` before it is eligible to stream, minus a tail-hold for a marker/TERM
            // prefix forming at its very end.
            const scrubbed = scrubDiagramMarkers(pending);
            const clean = scrubbed.text;
            const hold = tailHold(clean);
            const out = hold ? clean.slice(0, clean.length - hold) : clean;
            assistantReply += out;
            emit(out);
            pending = (hold ? clean.slice(clean.length - hold) : '') + scrubbed.rest;
          };
          const flushModel = () => {
            if (pending.includes(TERM)) pending = pending.split(TERM).join('');
            // Final flush: strip any complete marker, and drop a dangling incomplete one rather than
            // leaking a half-marker to the reader.
            const scrubbed = scrubDiagramMarkers(pending);
            const tail = scrubbed.text; // scrubbed.rest is an incomplete marker tail — discard it
            assistantReply += tail;
            emit(tail);
            pending = '';
          };

          // Abort the upstream if the browser hangs up; idempotent so a normal end can't
          // self-abort regardless of listener-removal ordering.
          const ctrl = new AbortController();
          const onClientGone = () => {
            if (!res.writableEnded) ctrl.abort();
          };
          res.on('close', onClientGone);
          const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);

          try {
            const upstream = await fetch(LLM_URL, {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                ...(LLM_API_KEY ? { authorization: `Bearer ${LLM_API_KEY}` } : {}),
                // OpenRouter attribution headers (harmless/ignored by other OpenAI-compatible servers):
                'HTTP-Referer': 'https://oraclous.com',
                'X-Title': 'Eurail × Oraclous Onboarder',
              },
              body: JSON.stringify({ model: LLM_MODEL, messages, stream: true }),
              signal: ctrl.signal,
            });

            if (!upstream.ok || !upstream.body) {
              console.error(`[eurail-chat] upstream ${upstream.status} from ${LLM_URL}`);
              clearTimeout(timer);
              res.off('close', onClientGone);
              return finish(
                `The onboarder model is unavailable right now (HTTP ${upstream.status}). Please try again in a moment.`,
              );
            }

            // --- parse the OpenAI SSE stream, buffering across chunk boundaries --------
            const reader = upstream.body.getReader();
            const dec = new TextDecoder();
            let buf = '';
            const drain = (/** @type {boolean} */ flush) => {
              let nl;
              while ((nl = buf.indexOf('\n')) !== -1) {
                let line = buf.slice(0, nl);
                buf = buf.slice(nl + 1);
                if (line.endsWith('\r')) line = line.slice(0, -1);
                line = line.trim();
                if (!line || line.startsWith(':')) continue; // blank / SSE comment
                if (!line.startsWith('data:')) continue; // ignore event:/id: fields
                const data = line.slice(5).trim();
                if (data === '[DONE]') return true; // treated as strictly terminal
                let evt;
                try {
                  evt = JSON.parse(data);
                } catch {
                  continue; // skip a malformed/partial JSON line
                }
                const delta = evt?.choices?.[0]?.delta?.content;
                if (typeof delta === 'string' && delta.length) {
                  gotAnyToken = true;
                  writeModel(delta);
                }
              }
              if (flush && buf.trim()) {
                buf += '\n';
                return drain(false);
              }
              return false;
            };

            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true }); // keep UTF-8 multibyte intact across reads
              if (drain(false)) break; // saw [DONE]
            }
            buf += dec.decode(); // flush any buffered multibyte tail
            drain(true);
            flushModel();

            clearTimeout(timer);
            res.off('close', onClientGone);

            // --- grounded diagram (after the prose, before %%END%%) ---------------------
            // If the onboarder asked for a picture and the socket is still open, run the
            // cartographer → verifier and emit one ```diagram block. The stream stays open (no
            // %%END%% yet), so the browser's streaming indicator stays alive during the call.
            // Strictly best-effort: any failure/empty result just skips the block.
            if (diagramIntent && gotAnyToken && !res.writableEnded && !ctrl.signal.aborted) {
              try {
                const verified = await buildVerifiedDiagram(diagramIntent);
                if (verified && !res.writableEnded) {
                  // Pretty-print so the closing fence lands on its own line (segments.ts wants a
                  // ```\n close). Leading \n\n separates the block from the prose above it.
                  const block = `\n\n\`\`\`${DIAGRAM_FENCE_LANG}\n${JSON.stringify(verified, null, 2)}\n\`\`\`\n`;
                  assistantReply += block;
                  emit(block);
                }
              } catch (err) {
                console.error('[eurail-chat] diagram emit failed:', /** @type {any} */ (err)?.message || err);
              }
            }

            finish(gotAnyToken ? undefined : 'No response was produced. Please try again.');
            // Persist a real reply (tokens produced) when the client supplied a sessionId.
            // Fire-and-forget AFTER finish() so disk I/O can't delay the stream; appendTurns
            // swallows its own errors.
            if (sid && gotAnyToken && assistantReply.trim()) void appendTurns(uid, sid, text, assistantReply);
          } catch (err) {
            clearTimeout(timer);
            res.off('close', onClientGone);
            if (ctrl.signal.aborted && res.writableEnded) {
              ended = true;
              return; // client navigated away — socket already closed
            }
            console.error('[eurail-chat] bridge error:', /** @type {any} */ (err)?.message || err);
            finish(
              ctrl.signal.aborted
                ? 'The onboarder model timed out. Please try again.'
                : "I couldn't reach the onboarder model — make sure your local LLM is running on its configured port (EURAIL_ONBOARDER_URL), then try again.",
            );
            // Atomicity: a turn that errored/timed-out AFTER partial tokens still happened and was
            // shown — persist the (partial) pair so reloaded history matches the live thread.
            if (sid && gotAnyToken && assistantReply.trim()) void appendTurns(uid, sid, text, assistantReply);
          }
        });

        // GET /eurail/api/chat/sessions       → { sessions: [...] } (most-recent first)
        // GET /eurail/api/chat/sessions/<id>  → the full session file
        // Dev-only, same-origin; never ships in the static build. Vite strips the mount prefix,
        // so req.url here is '' / '/' (list) or '/<id>' (one), plus any querystring.
        server.middlewares.use('/eurail/api/chat/sessions', async (req, res, next) => {
          if (req.method !== 'GET') return next();
          const urlPath = (req.url || '/').split('?')[0];
          const sendJson = (/** @type {number} */ code, /** @type {unknown} */ payload) => {
            res.statusCode = code;
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.setHeader('cache-control', 'no-store');
            res.end(JSON.stringify(payload));
          };

          // gate + scope: only a verified user's own conversations are ever read.
          const email = authedEmail(req);
          if (!email) return sendJson(401, { error: 'unauthorized' });
          const uid = emailHash(email);

          // single session: /eurail/api/chat/sessions/<id>
          if (urlPath !== '' && urlPath !== '/') {
            const sidRaw = decodeURIComponent(urlPath.replace(/^\//, ''));
            if (!safeId(sidRaw)) return sendJson(400, { error: 'bad session id' });
            const session = await readSession(uid, sidRaw);
            if (!session) return sendJson(404, { error: 'not found' });
            return sendJson(200, session);
          }

          // list: /eurail/api/chat/sessions
          /** @type {{ id: string, title: string, updatedAt: number, turnCount: number, preview: string }[]} */
          const sessions = [];
          try {
            const names = await readdir(userDir(uid));
            for (const name of names) {
              if (!name.endsWith('.json')) continue; // skip *.json.tmp / strays
              const sid = name.slice(0, -'.json'.length);
              if (!safeId(sid)) continue;
              const s = await readSession(uid, sid);
              if (!s) continue;
              const turns = Array.isArray(s.turns) ? s.turns : [];
              const lastUser = [...turns].reverse().find((/** @type {any} */ t) => t && t.role === 'user');
              const previewSrc = (lastUser?.content ?? turns[turns.length - 1]?.content ?? '').toString();
              sessions.push({
                id: s.id ?? sid,
                title: s.title || 'New conversation',
                updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : 0,
                turnCount: turns.length,
                preview: previewSrc.replace(/\s+/g, ' ').trim().slice(0, 120),
              });
            }
          } catch {
            // ENOENT: no conversation ever persisted — empty list.
          }
          sessions.sort((a, b) => b.updatedAt - a.updatedAt);
          return sendJson(200, { sessions });
        });

        // ── auth endpoints (dev-only @eurail.com email gate) ─────────────────────────
        //   POST /eurail/api/auth/request {email}      → email a 6-digit code (console fallback)
        //   POST /eurail/api/auth/verify  {email,code} → set the HttpOnly session cookie
        //   GET  /eurail/api/auth/me                   → { email } if a valid session, else 401
        //   POST /eurail/api/auth/logout               → clear the cookie
        server.middlewares.use('/eurail/api/auth', async (req, res, next) => {
          const sub = ((req.url || '/').split('?')[0].replace(/\/+$/, '')) || '/';
          const sendJson = (/** @type {number} */ code, /** @type {unknown} */ payload) => {
            res.statusCode = code;
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.setHeader('cache-control', 'no-store');
            res.end(JSON.stringify(payload));
          };

          if (sub === '/me' && req.method === 'GET') {
            const email = authedEmail(req);
            return email ? sendJson(200, { email }) : sendJson(401, { error: 'unauthorized' });
          }

          if (sub === '/logout' && req.method === 'POST') {
            clearSessionCookie(res);
            return sendJson(200, { ok: true });
          }

          if (sub === '/request' && req.method === 'POST') {
            const body = await readJsonBody(req);
            const email = normEmail(body?.email);
            if (!isAllowedEmail(email)) {
              return sendJson(403, { error: 'Access is limited to @eurail.com addresses.' });
            }
            const now = Date.now();
            // Opportunistic eviction of expired codes + a hard size cap, so a flood of distinct
            // addresses can't grow the dev store unbounded (memory-DoS hardening).
            for (const [k, v] of codeStore) if (now > v.exp) codeStore.delete(k);
            const prev = codeStore.get(email);
            if (!prev && codeStore.size >= MAX_PENDING_CODES) {
              return sendJson(429, { error: 'Too many pending verifications. Try again later.' });
            }
            if (prev && now - prev.lastSent < RESEND_MIN_INTERVAL_MS) {
              return sendJson(429, { error: 'Please wait a moment before requesting another code.' });
            }
            // Carry the failed-attempt count across resends WITHIN an unexpired window so a fresh
            // code can't launder the attempt budget (the '5 attempts' must bound guessing over time).
            const attempts = prev && now <= prev.exp ? prev.attempts : 0;
            const code = genCode();
            codeStore.set(email, { code, exp: now + CODE_TTL_MS, attempts, lastSent: now });
            await sendCode(email, code);
            return sendJson(200, { ok: true }); // never reveal whether emailed vs console-logged
          }

          if (sub === '/verify' && req.method === 'POST') {
            const body = await readJsonBody(req);
            const email = normEmail(body?.email);
            const code = String(body?.code ?? '').trim();
            const rec = codeStore.get(email);
            if (!isAllowedEmail(email) || !rec || Date.now() > rec.exp) {
              return sendJson(400, { error: 'Invalid or expired code. Request a new one.' });
            }
            rec.attempts += 1;
            if (rec.attempts > MAX_CODE_ATTEMPTS) {
              // Keep the record (do NOT delete) so the lockout survives a resend until the code
              // expires and is swept — otherwise a new code would reset the budget.
              return sendJson(429, { error: 'Too many attempts. Try again in a few minutes.' });
            }
            const a = Buffer.from(code);
            const b = Buffer.from(rec.code);
            if (a.length !== b.length || !timingSafeEqual(a, b)) {
              return sendJson(400, { error: 'Invalid or expired code. Request a new one.' });
            }
            codeStore.delete(email); // single-use on success
            setSessionCookie(res, signToken(email));
            return sendJson(200, { email });
          }

          return next();
        });
      },
    },
  };
}

/**
 * Flatten an mdast node to its text content (no extra deps).
 * @param {any} node
 * @returns {string}
 */
function nodeText(node) {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('');
  return '';
}

/**
 * Strip authoring trailers from the marketing markdown before render:
 *  - the `**Internal links:**` / `**Notes for build:**` trailer paragraphs
 *    (and a thematic break immediately preceding them), and
 *  - inline `(build note)` blockquotes,
 * while PRESERVING the `> **Citable answer**` blockquotes (AEO content).
 * See marketing-app-architecture.md §3.4.
 */
function remarkStripBuildNotes() {
  return (/** @type {any} */ tree) => {
    const children = tree.children;
    // 1) Cut from the first trailer paragraph to the end of the document.
    let cut = -1;
    for (let i = 0; i < children.length; i++) {
      const text = nodeText(children[i]).trim();
      if (/^(Internal links:|Notes for build:)/i.test(text)) {
        cut = i;
        break;
      }
    }
    if (cut !== -1) {
      let start = cut;
      if (start > 0 && children[start - 1].type === 'thematicBreak') start -= 1;
      children.splice(start);
    }
    // 2) Remove inline "(build note)" blockquotes; keep "Citable answer" blockquotes.
    tree.children = children.filter((/** @type {any} */ node) => {
      if (node.type === 'blockquote' && /build note/i.test(nodeText(node))) return false;
      return true;
    });
  };
}

/**
 * Drop the leading H1 from a content body — the designed page hero (PageHero.astro) supplies
 * the visible H1, so the markdown's own H1 would be a duplicate. Only affects rendered <Content/>
 * (not the raw entry.body the JSON-LD/FAQ parser reads). The bespoke Home doesn't render its body.
 */
function remarkStripLeadingH1() {
  return (/** @type {any} */ tree) => {
    const first = tree.children?.[0];
    if (first && first.type === 'heading' && first.depth === 1) {
      tree.children.shift();
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://oraclous.com',
  trailingSlash: 'never',
  integrations: [sitemap(), react(), eurailChatBridge()],
  markdown: {
    remarkPlugins: [remarkStripLeadingH1, remarkStripBuildNotes],
  },
  vite: {
    resolve: {
      // Force a single React across the React islands. A stray React 19 lingers in the pnpm
      // store (a transitive of another workspace package); without this, Vite's dep optimizer
      // can serve a mismatched copy to the browser and the island fails to hydrate with
      // "jsxDEV is not a function". Pin the island runtime to the app's React 18.
      dedupe: ['react', 'react-dom'],
    },
  },
});