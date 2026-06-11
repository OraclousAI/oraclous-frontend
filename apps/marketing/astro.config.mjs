// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { loadEnvFile, makeEnv } from './server/env.mjs';
import { mountEurailApi } from './server/eurail-api.mjs';

// Dev config from apps/marketing/.env (gitignored), shared reader with the sidecar.
const onboarderEnv = makeEnv(loadEnvFile(new URL('./.env', import.meta.url)));

/**
 * The Eurail onboarder bridge (dev mounting). The actual API — auth gate, grounded chat
 * streaming, cartographer diagrams, per-user history — lives in ./server/eurail-api.mjs and is
 * shared verbatim with the production sidecar (./server/index.mjs, deployed to the VPS behind an
 * nginx `location /eurail/api/` proxy). Here it is mounted on the Vite dev server so `astro dev`
 * serves the whole feature locally with zero extra processes.
 *
 * Secrets come from apps/marketing/.env (gitignored) via the shared reader; nothing reaches the
 * client bundle (no `PUBLIC_` prefix) and the static `astro build` omits this integration's
 * middleware entirely, so no key ever ships to the browser.
 *
 * @returns {import('astro').AstroIntegration}
 */
function eurailChatBridge() {
  return {
    name: 'eurail-chat-bridge',
    hooks: {
      'astro:server:setup': ({ server }) => {
        mountEurailApi((prefix, handler) => server.middlewares.use(prefix, handler), {
          env: onboarderEnv,
          eurailDir: new URL('./src/eurail/', import.meta.url),
          sessionsDir: new URL('./.eurail-sessions/', import.meta.url),
          secureCookies: false, // http://localhost would refuse a Secure cookie
          logCodes: true, // dev convenience: codes always visible on the dev-server console
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