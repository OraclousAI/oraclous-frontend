'use client';
// The AI onboarder. An onboarding chat that streams real token-by-token: the question POSTs to
// the SSR route /eurail/api/chat (which logs it to the server console for Claude to answer), and
// the reply streams straight back from the response body — exactly Claude-style progressive text.
//
// Reply tokens written by the model: trailing `%%END%%` (reply complete, stripped server-side)
// and `%%CHIPS: a | b | c%%` (render quick-reply buttons).
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Msg {
  id: string;
  role: 'bot' | 'user';
  text: string;
  streaming: boolean;
  chips?: string[] | undefined;
}

const ROLE_CHIPS = ['Board / leadership', 'Technical & strategy', 'Commercial & partnership', 'Assurance & due-diligence'];
const greeting: Msg = {
  id: 'greet',
  role: 'bot',
  text:
    "Welcome — I'll walk you through the Eurail × Oraclous AI analysis in a few minutes, tailored to you, with every claim traceable to the evidence.\n\nFirst, so I can pitch this right: which best describes you?",
  streaming: false,
  chips: ROLE_CHIPS,
};

function genId() {
  return ('c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toLowerCase();
}
function parseReply(raw: string): { text: string; chips: string[] } {
  let text = raw.replace('%%END%%', '');
  let chips: string[] = [];
  const m = text.match(/%%CHIPS:(.*?)%%/s);
  if (m) {
    chips = (m[1] ?? '').split('|').map((c) => c.trim()).filter(Boolean);
    text = text.replace(m[0], '');
  }
  // Hide a partial, not-yet-closed chips token while streaming.
  text = text.replace(/%%CHIPS:[^%]*$/s, '');
  return { text: text.trimEnd(), chips };
}

export function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([greeting]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function setBot(id: string, patch: Partial<Msg>) {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setInput('');
    setMessages((ms) => ms.map((m) => (m.chips ? { ...m, chips: undefined } : m)));
    const id = genId();
    setMessages((ms) => [
      ...ms,
      { id: id + '-u', role: 'user', text: t, streaming: false },
      { id, role: 'bot', text: '', streaming: true },
    ]);
    try {
      const res = await fetch('/eurail/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, text: t }),
      });
      if (!res.body) throw new Error('no stream');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setBot(id, { text: parseReply(acc).text });
      }
      const { text: finalText, chips } = parseReply(acc);
      setBot(id, { text: finalText || '(no response)', streaming: false, chips });
    } catch {
      setBot(id, { text: '(bridge offline — start the dev server)', streaming: false });
    } finally {
      setBusy(false);
    }
  }

  const lastId = messages[messages.length - 1]?.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', height: 'calc(100vh - 56px - var(--sp-16))', minHeight: 460 }}>
      <div style={{ flex: 'none' }}>
        <p className="t-eyebrow" style={{ color: 'var(--fg-mute)', margin: 0 }}>GUIDED · AI ONBOARDER</p>
        <h1 className="t-h2" style={{ margin: '2px 0 0' }}>Let me walk you through it</h1>
      </div>

      <div
        ref={threadRef}
        role="log"
        aria-live="polite"
        aria-label="Onboarding conversation"
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', paddingRight: 'var(--sp-1)' }}
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const showChips = !!m.chips && m.id === lastId && !m.streaming;
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 'var(--sp-2)' }}>
              <div
                className="t-body"
                style={{
                  maxWidth: '80%',
                  padding: 'var(--sp-3) var(--sp-4)',
                  borderRadius: 'var(--r-4)',
                  background: isUser ? 'var(--ink)' : 'var(--bg-soft)',
                  color: isUser ? 'var(--paper)' : 'var(--fg)',
                  border: isUser ? 'none' : '1px solid var(--rule)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.text}
                {m.role === 'bot' && m.streaming && !m.text && (
                  <span className="t-dense" style={{ color: 'var(--fg-mute)' }}>thinking…</span>
                )}
                {m.role === 'bot' && m.streaming && (
                  <span className="is-blink" aria-hidden="true" style={{ borderLeft: '2px solid var(--fg)', marginLeft: 1 }} />
                )}
              </div>
              {showChips && (
                <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', maxWidth: '80%' }}>
                  {m.chips!.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => send(chip)}
                      className="t-dense"
                      style={{ padding: '6px var(--sp-3)', borderRadius: 'var(--r-pill)', border: '1px solid var(--info)', background: 'var(--bg)', color: 'var(--info)', cursor: 'pointer' }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        style={{ flex: 'none', display: 'flex', gap: 'var(--sp-2)', alignItems: 'flex-end' }}
      >
        <label htmlFor="chat-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Reply to the onboarder
        </label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Type a reply, or pick an option above…"
          style={{ flex: 1, font: 'inherit', padding: 'var(--sp-3)', borderRadius: 'var(--r-3, 8px)', border: '1px solid var(--rule)', background: 'var(--bg)', color: 'var(--fg)', resize: 'none' }}
        />
        <button type="submit" className="cta cta-primary" disabled={busy || !input.trim()} style={{ opacity: busy || !input.trim() ? 0.5 : 1 }}>
          {busy ? 'Streaming…' : 'Send'}
        </button>
      </form>
      <p className="t-caption" style={{ flex: 'none', color: 'var(--fg-mute)', margin: 0 }}>
        Dev test mode — the onboarder is bridged to the maintainer’s console.{' '}
        <Link href="/" style={{ color: 'var(--info)' }}>Skip and browse the dashboard</Link>.
      </p>
    </div>
  );
}
