// RichMessage — renders a bot turn as ordered segments: light markdown prose interleaved with
// ```diagram fenced blocks. ChatPage strips %%END%% / %%CHIPS%% (and the %%DIAGRAM intent marker)
// before handing the text here; this component is concerned only with markdown vs diagram.
//
// Streaming-safe by construction (see ./segments.ts). The text arrives token-by-token, so at any
// instant a ```diagram fence may be: (a) not yet opened, (b) opened but not yet closed, or (c) closed
// with complete JSON. splitSegments splits on the OPENING fence; a block only renders once its
// CLOSING fence has arrived AND the body JSON.parses AND coerces to a valid spec. An open-but-unclosed
// (or unparseable) diagram block renders NOTHING — never a flash of raw JSON, never a parse error. The
// preceding/closed prose keeps streaming normally. (The diagram block is appended whole by the
// middleware after the cartographer+verifier run, so it normally arrives complete.)
//
// Gate 5: diagrams and markdown both render to React elements only — no raw-HTML injection sink. Every
// figure in a verified spec is grounded; the renderer can never paint an ungrounded number.
import type { ReactNode } from 'react';
import { Markdown } from './Markdown.js';
import { Diagram } from './diagram/Diagram.js';
import { coerceDiagramSpec, type DiagramSpec } from './diagram/spec.js';
import { splitSegments } from './segments.js';

/** Parse a fenced diagram body to a valid verified spec, or null (incomplete/invalid → render nothing). */
function parseDiagram(json: string): DiagramSpec | null {
  const trimmed = json.trim();
  if (!trimmed) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null; // closed fence but JSON not yet whole / malformed — skip silently
  }
  return coerceDiagramSpec(parsed);
}

export function RichMessage({ text }: { text: string }): ReactNode {
  const segments = splitSegments(text);

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === 'md') {
          return <Markdown key={`md-${i}`} text={seg.text} />;
        }
        const spec = parseDiagram(seg.json);
        if (!spec) return null; // unparseable/incomplete/invalid → graceful nothing
        return <Diagram key={`diagram-${i}`} spec={spec} />;
      })}
    </>
  );
}
