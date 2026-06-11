// Streaming segment splitter for RichMessage. Pure, component-free (kept out of RichMessage.tsx so
// that file only exports a component — react-refresh / HMR friendliness for the chat island).
//
// Splits streamed bot text into ordered markdown / diagram segments. A diagram segment is emitted only
// when a COMPLETE fenced block is present: an opening ```diagram line, a body, and a closing ``` line.
// While a diagram fence is open but not yet closed (mid-stream), everything from the opening fence
// onward is held back — neither rendered as prose nor as a diagram — until the close arrives. That
// gives the "render nothing for an incomplete block until it closes" behaviour for free.
//
// The diagram block is appended by the middleware AFTER the prose finishes streaming (it runs the
// cartographer + verifier, then injects one ```diagram\n{verified spec}\n``` block), so in practice the
// fence arrives whole — but the streaming-safe splitter holds back a torn fence regardless.

export type Segment = { kind: 'md'; text: string } | { kind: 'diagram'; json: string };

// Opening fence: ``` then "diagram", optional trailing spaces, then a newline. Tolerates leading
// indentation before the fence (some models indent) and CRLF.
const DIAGRAM_OPEN = /(?:^|\n)[ \t]*```[ \t]*diagram[ \t]*\r?\n/;

// Closing fence: a line that is just ``` (optionally indented / trailing spaces), or the same at the
// very start of the remaining body.
const DIAGRAM_CLOSE = /\r?\n[ \t]*```[ \t]*(?:\r?\n|$)|^[ \t]*```[ \t]*(?:\r?\n|$)/;

export function splitSegments(input: string): Segment[] {
  const segments: Segment[] = [];
  let rest = input;

  for (;;) {
    const open = rest.match(DIAGRAM_OPEN);
    if (!open || open.index === undefined) {
      if (rest) segments.push({ kind: 'md', text: rest });
      break;
    }

    // Prose before the fence (the leading newline matched by DIAGRAM_OPEN stays out of the block).
    const before = rest.slice(0, open.index);
    if (before) segments.push({ kind: 'md', text: before });

    const bodyStart = open.index + open[0].length;
    const afterOpen = rest.slice(bodyStart);

    const close = afterOpen.match(DIAGRAM_CLOSE);
    if (!close || close.index === undefined) {
      // Fence still open — hold everything from here back until it closes. Stop emitting.
      break;
    }

    const json = afterOpen.slice(0, close.index);
    segments.push({ kind: 'diagram', json });

    // Continue after the closing fence.
    rest = afterOpen.slice(close.index + close[0].length);
  }

  return segments;
}
