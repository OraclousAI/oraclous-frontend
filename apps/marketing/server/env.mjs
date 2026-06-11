// @ts-check
// Minimal KEY=VALUE .env reader shared by the dev bridge (astro.config.mjs) and the production
// sidecar (server/index.mjs) — no dotenv dependency. Values never reach the client bundle.
import { readFileSync } from 'node:fs';

/**
 * Parse one .env file into a flat record. Missing/unreadable file → {}.
 * @param {URL | string} fileUrl
 * @returns {Record<string, string>}
 */
export function loadEnvFile(fileUrl) {
  /** @type {Record<string, string>} */
  const out = {};
  try {
    const txt = readFileSync(fileUrl, 'utf8');
    for (const rawLine of txt.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
  } catch {
    /* no .env file — fall back to process.env / defaults */
  }
  return out;
}

/**
 * First candidate file that exists wins (e.g. the deploy root's .env, else the app's).
 * @param {(URL | string)[]} candidates
 * @returns {Record<string, string>}
 */
export function loadFirstEnvFile(candidates) {
  for (const c of candidates) {
    const env = loadEnvFile(c);
    if (Object.keys(env).length > 0) return env;
  }
  return {};
}

/**
 * Build the lookup used everywhere: process.env overrides the file, then the fallback.
 * @param {Record<string, string>} fileEnv
 * @returns {(name: string, fallback: string) => string}
 */
export function makeEnv(fileEnv) {
  return (name, fallback) => process.env[name] ?? fileEnv[name] ?? fallback;
}
