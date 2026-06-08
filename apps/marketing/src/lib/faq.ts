import { stripInlineMarkdown } from './text';

export interface Faq {
  q: string;
  a: string;
}

/**
 * Parse the `**Q: …**` / `A: …` FAQ blocks the marketing pages use, so the same
 * body feeds both the visible FAQ and the `FAQPage` JSON-LD (single source).
 * Answer text is stripped of inline markdown so JSON-LD ships clean prose.
 */
export function parseFaq(body: string): Faq[] {
  if (!body) return [];
  const faqs: Faq[] = [];
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const q = lines[i].match(/^\*\*Q:\s*(.+?)\*\*\s*$/);
    if (!q) continue;
    let answer = '';
    for (let j = i + 1; j < lines.length; j++) {
      const a = lines[j].match(/^A:\s*(.+)$/);
      if (a) {
        answer = a[1].trim();
        i = j;
        break;
      }
      if (lines[j].trim() === '') continue;
      break;
    }
    if (answer) faqs.push({ q: stripInlineMarkdown(q[1].trim()), a: stripInlineMarkdown(answer) });
  }
  return faqs;
}
