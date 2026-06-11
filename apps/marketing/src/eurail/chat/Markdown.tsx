// Dependency-free markdown → React renderer for onboarder bot text (issue #1).
//
// The bot streams markdown; rendering it as plain text showed literal `**` / `[t](url)`.
// This turns a *text segment* (RichMessage owns segmentation; chips + %%END%% stay in
// ChatPage) into React elements — never innerHTML (CI Gate 5). It is deliberately small:
// bold, italic, inline code, links (safe http(s)/relative only), and unordered + ordered
// lists, with paragraph + line breaks.
//
// Streaming-tolerant by construction. The inline scanner only treats a delimiter as
// formatting when its *closer* is already present in the remaining text; a half-typed
// `**bold` or `[label](http` renders as literal characters until the closer arrives, so
// the bubble never flickers broken markup token-by-token. No design invention — all
// styling is design-system tokens, matching the chat bubble.
//
// Scope (by design): no tables, headings, code fences, or images. Headings/tables aren't
// in the onboarder's voice (onboarder.system.md), and fenced ```chart``` blocks are split
// out by RichMessage *before* this renderer sees the text — so a fence never reaches here.

import { Fragment, type ReactNode } from 'react';

/** A relative href, or an absolute http(s) URL — anything else (javascript:, data:, mailto:, …) is rejected. */
function isSafeHref(href: string): boolean {
  const h = href.trim();
  if (!h) return false;
  // Relative / same-document targets are safe (no scheme to smuggle).
  if (/^(\/|#|\.\/|\.\.\/|\?)/.test(h)) return true;
  // Otherwise it must be an explicit http(s) URL. A bare scheme-relative `//host` is
  // allowed (inherits the page's https); everything with a `:` that isn't http(s) is out.
  if (/^\/\//.test(h)) return true;
  return /^https?:\/\//i.test(h);
}

/**
 * Parse inline markdown in `src` into React nodes. Left-to-right, greedy, closer-aware:
 * an opener without a visible closer is emitted as literal text (the streaming-safety rule).
 * `keyBase` namespaces React keys so sibling renders don't collide.
 */
function renderInline(src: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let buf = ''; // accumulates plain characters between formatted spans
  let k = 0; // running key counter
  const flush = () => {
    if (buf) {
      out.push(<Fragment key={`${keyBase}-t${k++}`}>{buf}</Fragment>);
      buf = '';
    }
  };

  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];

    // --- inline code: `code` (highest precedence; its body is literal, never re-parsed) ---
    if (ch === '`') {
      const end = src.indexOf('`', i + 1);
      if (end > i) {
        flush();
        out.push(
          <code
            key={`${keyBase}-c${k++}`}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.92em',
              padding: '0.05em 0.35em',
              borderRadius: 'var(--r-2)',
              background: 'color-mix(in oklab, var(--fg) 8%, transparent)',
              border: '1px solid var(--border-hair)',
            }}
          >
            {src.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
      // no closer yet (streaming) — fall through, treat the backtick as a literal char
    }

    // --- link: [text](href) ---
    if (ch === '[') {
      const close = src.indexOf(']', i + 1);
      if (close > i && src[close + 1] === '(') {
        const paren = src.indexOf(')', close + 2);
        if (paren > close) {
          const label = src.slice(i + 1, close);
          const href = src.slice(close + 2, paren);
          flush();
          if (isSafeHref(href)) {
            const external = /^(https?:)?\/\//i.test(href.trim());
            out.push(
              <a
                key={`${keyBase}-l${k++}`}
                href={href.trim()}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={{ color: 'var(--info)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                {renderInline(label, `${keyBase}-l${k}`)}
              </a>,
            );
          } else {
            // Unsafe scheme: drop the anchor, keep the visible label as plain text.
            out.push(<Fragment key={`${keyBase}-lt${k++}`}>{renderInline(label, `${keyBase}-lt${k}`)}</Fragment>);
          }
          i = paren + 1;
          continue;
        }
      }
      // incomplete link (streaming) — treat `[` as a literal char
    }

    // --- bold: **text** (checked before single-char emphasis) ---
    if (ch === '*' && src[i + 1] === '*') {
      const end = src.indexOf('**', i + 2);
      if (end > i + 1) {
        flush();
        out.push(
          <strong key={`${keyBase}-b${k++}`} style={{ fontWeight: 650 }}>
            {renderInline(src.slice(i + 2, end), `${keyBase}-b${k}`)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
      // no closing ** yet — literal
    }

    // --- italic: *text* or _text_ ---
    if (ch === '*' || ch === '_') {
      // Don't treat `_` mid-word as emphasis (snake_case, file_name) — only at a boundary.
      const prev = i > 0 ? src[i - 1] : '';
      const boundaryOk = ch === '*' || !/\w/.test(prev);
      if (boundaryOk) {
        const end = src.indexOf(ch, i + 1);
        // require non-empty content and avoid swallowing a `**` opener as italic
        if (end > i + 1 && !(ch === '*' && src[i + 1] === '*')) {
          flush();
          out.push(
            <em key={`${keyBase}-i${k++}`}>{renderInline(src.slice(i + 1, end), `${keyBase}-i${k}`)}</em>,
          );
          i = end + 1;
          continue;
        }
      }
      // no closer / mid-word `_` — literal
    }

    buf += ch;
    i++;
  }

  flush();
  return out;
}

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[]; start: number };

const UL_RE = /^\s*[-*+]\s+(.*)$/;
const OL_RE = /^\s*(\d+)[.)]\s+(.*)$/;

/** Group raw text lines into block-level structures. Blank lines separate paragraphs. */
function toBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: 'p', lines: para });
      para = [];
    }
  };

  for (const line of lines) {
    const ul = UL_RE.exec(line);
    const ol = OL_RE.exec(line);
    if (ul) {
      flushPara();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === 'ul') last.items.push(ul[1] ?? '');
      else blocks.push({ kind: 'ul', items: [ul[1] ?? ''] });
    } else if (ol) {
      flushPara();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === 'ol') last.items.push(ol[2] ?? '');
      else blocks.push({ kind: 'ol', items: [ol[2] ?? ''], start: Number(ol[1]) || 1 });
    } else if (line.trim() === '') {
      flushPara();
    } else {
      para.push(line);
    }
  }
  flushPara();
  return blocks;
}

const LIST_STYLE = { margin: 'var(--sp-2) 0', paddingLeft: 'var(--sp-5)', display: 'grid', gap: 'var(--sp-1)' } as const;

export interface MarkdownProps {
  /** Raw (possibly mid-stream) markdown for one text segment. */
  text: string;
}

/**
 * Render one markdown text segment as React elements. Safe to call on every streamed
 * frame — it's pure and cheap, and tolerates partial syntax (see renderInline).
 */
export function Markdown({ text }: MarkdownProps) {
  const blocks = toBlocks(text);
  return (
    <>
      {blocks.map((b, bi) => {
        if (b.kind === 'ul') {
          return (
            <ul key={`ul-${bi}`} style={LIST_STYLE}>
              {b.items.map((it, ii) => (
                <li key={ii}>{renderInline(it, `ul-${bi}-${ii}`)}</li>
              ))}
            </ul>
          );
        }
        if (b.kind === 'ol') {
          return (
            <ol key={`ol-${bi}`} start={b.start} style={LIST_STYLE}>
              {b.items.map((it, ii) => (
                <li key={ii}>{renderInline(it, `ol-${bi}-${ii}`)}</li>
              ))}
            </ol>
          );
        }
        // paragraph: soft line breaks within the block become <br/>
        return (
          <p key={`p-${bi}`} style={{ margin: bi === 0 ? '0' : 'var(--sp-2) 0 0' }}>
            {b.lines.map((ln, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {renderInline(ln, `p-${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

export default Markdown;
