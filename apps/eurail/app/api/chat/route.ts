// DEV chat bridge as an SSR API route. The question is logged to the SERVER console (port
// stdout) with a flag Claude watches; Claude writes the reply to an outbox file; this route
// streams that file back to the browser as it grows — real token-by-token streaming.
// Dev/test only — a production chatbot would call an LLM via the Application Gateway.
import { mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DIR = '/tmp/eurail-chat';
const INBOX = join(DIR, 'inbox');
const OUTBOX = join(DIR, 'outbox');

const safeId = (s: unknown): s is string => typeof s === 'string' && /^[a-z0-9-]{6,40}$/.test(s);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STREAM_HEADERS = {
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'no-store',
  'x-accel-buffering': 'no',
};

export async function POST(req: Request) {
  mkdirSync(INBOX, { recursive: true });
  mkdirSync(OUTBOX, { recursive: true });

  let body: { id?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response('bad json', { status: 400 });
  }
  const { id, text } = body;
  if (!safeId(id) || typeof text !== 'string' || !text.trim()) {
    return new Response('bad request', { status: 400 });
  }

  // Every question routes to Claude via the dev bridge (console flag + outbox stream) — fully
  // AI-answered. Claude answers in-scope questions from the corpus, and replies out-of-scope
  // ones with an honest "outside this analysis" note.
  writeFileSync(join(INBOX, `${id}.json`), JSON.stringify({ id, text, at: Date.now() }));
  appendFileSync(join(DIR, 'questions.log'), `${id}\t${text.replace(/\s+/g, ' ')}\n`);
  // THE flagged line Claude's Monitor greps on the dev-server stdout:
  console.log(`\x1b[36m[eurail-chat] Q:\x1b[0m ${id} :: ${text}`);

  const file = join(OUTBOX, `${id}.md`);
  const doneMarker = join(OUTBOX, `${id}.done`);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = 0;
      // Poll the outbox for ~3 minutes; stream new text as Claude writes it.
      for (let i = 0; i < 720; i++) {
        if (existsSync(file)) {
          let t = readFileSync(file, 'utf8');
          const done = t.includes('%%END%%') || existsSync(doneMarker);
          t = t.replace('%%END%%', '');
          if (t.length > sent) {
            controller.enqueue(encoder.encode(t.slice(sent)));
            sent = t.length;
          }
          if (done) break;
        }
        await sleep(250);
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: STREAM_HEADERS });
}
