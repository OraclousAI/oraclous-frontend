// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkStripLeadingH1, remarkStripBuildNotes],
  },
});
