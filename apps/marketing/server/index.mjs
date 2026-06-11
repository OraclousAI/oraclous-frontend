// @ts-check
// The Eurail API sidecar — the production home of the same handlers `astro dev` mounts locally.
// Runs as a tiny node:http service (systemd-managed) next to the static marketing site; nginx
// proxies `location /eurail/api/` to it (with proxy_buffering off so the chat streams).
//
// Deploy layout (rsync'd by .github/workflows/deploy.yml):
//   /opt/oraclous-eurail/
//   ├── .env                 ← secrets, placed once by hand (never in git, outside the rsync)
//   ├── .eurail-sessions/    ← per-user conversation store (writable, outside the rsync)
//   └── app/                 ← rsync --delete target
//       ├── server/          ← this file + eurail-api.mjs + env.mjs + node_modules (nodemailer)
//       └── src/eurail/      ← corpus JSON + prompts + the diagram verifier
//
// Config (env or the .env file): EURAIL_API_PORT (8787) · EURAIL_API_HOST (127.0.0.1) ·
// EURAIL_SESSIONS_DIR (default ../../.eurail-sessions relative to this file) ·
// EURAIL_COOKIE_SECURE (default 1 — the site is behind HTTPS) · EURAIL_LOG_CODES (default 0) ·
// plus everything eurail-api.mjs reads (EURAIL_ONBOARDER_*, SMTP_*, EURAIL_AUTH_SECRET, …).
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { loadFirstEnvFile, makeEnv } from './env.mjs';
import { mountEurailApi } from './eurail-api.mjs';

// .env candidates: the deploy root (/opt/oraclous-eurail/.env) first, then the in-repo
// apps/marketing/.env (so the sidecar can also be run straight from the checkout).
const fileEnv = loadFirstEnvFile([new URL('../../.env', import.meta.url), new URL('../.env', import.meta.url)]);
const env = makeEnv(fileEnv);

const PORT = Number(env('EURAIL_API_PORT', '8787')) || 8787;
const HOST = env('EURAIL_API_HOST', '127.0.0.1');

const sessionsDirRaw = env('EURAIL_SESSIONS_DIR', '');
const sessionsDir = sessionsDirRaw
  ? pathToFileURL(sessionsDirRaw.endsWith('/') ? sessionsDirRaw : `${sessionsDirRaw}/`)
  : new URL('../../.eurail-sessions/', import.meta.url);

// A connect-compatible mini router: first matching prefix wins unless the handler next()s —
// then matching continues (req.url is restored), mirroring how Vite mounts the same handlers.
/** @type {{ prefix: string, handler: (req: any, res: any, next: () => void) => void | Promise<void> }[]} */
const routes = [];
mountEurailApi((prefix, handler) => routes.push({ prefix, handler }), {
  env,
  eurailDir: new URL('../src/eurail/', import.meta.url),
  sessionsDir,
  secureCookies: env('EURAIL_COOKIE_SECURE', '1') === '1',
  logCodes: env('EURAIL_LOG_CODES', '0') === '1',
});

const server = createServer(async (req, res) => {
  const url = req.url || '/';
  const path = url.split('?')[0];

  if (path === '/healthz') {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.end('ok');
  }

  for (const { prefix, handler } of routes) {
    if (path !== prefix && !path.startsWith(`${prefix}/`)) continue;
    req.url = url.slice(prefix.length) || '/';
    let advanced = false;
    try {
      await handler(req, res, () => {
        advanced = true;
      });
    } catch (err) {
      console.error('[eurail-api] handler error:', /** @type {any} */ (err)?.message || err);
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.end('internal error');
      }
      return;
    }
    if (!advanced) return; // the handler owned the response
    req.url = url; // restore for the next candidate route
  }

  res.statusCode = 404;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, HOST, () => {
  console.log(`[eurail-api] listening on http://${HOST}:${PORT} (sessions: ${sessionsDir.pathname})`);
});

// Exit cleanly under systemd (Restart=always handles crashes; stop should be prompt).
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
