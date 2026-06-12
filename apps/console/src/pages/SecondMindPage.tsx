// Second Mind — the member chat console (issue #57 / Wave 3). A thread is a conversation bound to a
// published agent; sending a message runs the agent SYNCHRONOUSLY (no streaming) and returns a turn
// whose `status` we branch on. The mockup's right "memory feed" rail is dropped — no endpoint backs
// it (§8); the layout is a thread rail + a message stream + a composer. Assistant content is
// rendered as plain text — never as raw/injected HTML (Gate 5; model output is untrusted).
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { ApiClientError, type ChatThread, type ChatTurnStatus } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import { usePublishedAgents } from '../lib/publishedAgents.js';
import {
  useDeleteThread,
  useMessages,
  useSendMessage,
  useSetFeedback,
  useStartThread,
  useThreads,
} from '../lib/chat.js';
import { useToast } from '../lib/toast.jsx';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconSparkle, IconPlus } from '../icons/index.js';
import './second-mind.css';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

function initials(s: string): string {
  return (
    s
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

function formatTime(iso: string | null): string {
  if (iso === null) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

export default function SecondMindPage() {
  const { currentOrg, user } = useDash();
  const orgId = currentOrg?.id ?? '';
  const { threads, isLoading: threadsLoading } = useThreads();
  const { agents, isLoading: agentsLoading, isError: agentsError } = usePublishedAgents(orgId);
  const activeAgents = useMemo(() => agents.filter((a) => a.status === 'active'), [agents]);
  // Only assert "no agents" once the query has settled — a loading/errored empty list must not read
  // as a genuine zero (mirrors the other surfaces' settled-guard).
  const agentsSettled = !agentsLoading && !agentsError;

  const startThread = useStartThread();
  const deleteThread = useDeleteThread();
  const toast = useToast();

  const [selectedId, setSelectedId] = useState<string>('');
  const [newOpen, setNewOpen] = useState(false);
  const [newAgent, setNewAgent] = useState('');
  const [newError, setNewError] = useState<string | null>(null);

  const selectedThread = threads.find((t) => t.id === selectedId) ?? null;

  async function onStartThread(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNewError(null);
    if (newAgent === '') {
      setNewError('Choose a published agent to chat with.');
      return;
    }
    try {
      const t = await startThread.mutateAsync({ agentSlug: newAgent });
      setSelectedId(t.id);
      setNewOpen(false);
      setNewAgent('');
    } catch (cause) {
      setNewError(messageFor(cause));
    }
  }

  async function onDeleteThread(id: string) {
    try {
      await deleteThread.mutateAsync(id);
      if (selectedId === id) setSelectedId('');
      toast.success('Conversation deleted.');
    } catch (cause) {
      toast.error(messageFor(cause));
    }
  }

  return (
    <div className="chat-page">
      <aside className="chat-rail" aria-label="Conversations">
        <div className="chat-rail-head">
          <span className="eyebrow">
            <span className="dot" aria-hidden="true" />
            Second Mind
          </span>
          <button
            type="button"
            className="btn"
            data-variant="secondary"
            data-size="sm"
            onClick={() => {
              setNewOpen((v) => !v);
              setNewError(null);
            }}
            aria-expanded={newOpen}
          >
            <IconPlus size={13} /> New chat
          </button>
        </div>

        {newOpen &&
          (!agentsSettled ? (
            <p className="chat-rail-empty">Loading agents…</p>
          ) : activeAgents.length === 0 ? (
            <div className="callout" data-tone="warning">
              <span>Publish an agent first — a conversation is bound to a published agent.</span>
            </div>
          ) : (
            <form className="chat-new" onSubmit={onStartThread}>
              <label className="chat-new-label" htmlFor="chat-new-agent">
                Agent
              </label>
              <select
                id="chat-new-agent"
                value={newAgent}
                onChange={(e) => setNewAgent(e.target.value)}
              >
                <option value="">Select an agent…</option>
                {activeAgents.map((a) => (
                  <option key={a.id} value={a.slug}>
                    {a.displayName ?? a.slug} (/{a.slug})
                  </option>
                ))}
              </select>
              {newError !== null && (
                <span className="chat-new-error" role="alert">
                  {newError}
                </span>
              )}
              <button
                type="submit"
                className="btn"
                data-variant="primary"
                data-size="sm"
                disabled={startThread.isPending}
              >
                {startThread.isPending ? 'Starting…' : 'Start conversation'}
              </button>
            </form>
          ))}

        {threadsLoading ? (
          <SkeletonList rows={4} />
        ) : threads.length === 0 ? (
          <p className="chat-rail-empty">No conversations yet. Start one above.</p>
        ) : (
          <ul className="chat-threads">
            {threads.map((t) => (
              <li key={t.id}>
                <ThreadRow
                  thread={t}
                  selected={t.id === selectedId}
                  onSelect={() => setSelectedId(t.id)}
                  onDelete={() => onDeleteThread(t.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="chat-main" aria-label="Conversation">
        {selectedThread === null ? (
          <div className="chat-empty">
            <span className="chat-empty-icon" aria-hidden="true">
              <IconSparkle size={24} />
            </span>
            <span className="t">Your Second Mind</span>
            <span className="s">
              Pick a conversation, or start a new one to chat with one of your published agents.
            </span>
          </div>
        ) : (
          <Conversation key={selectedThread.id} thread={selectedThread} userName={user.name} />
        )}
      </section>
    </div>
  );
}

function ThreadRow({
  thread,
  selected,
  onSelect,
  onDelete,
}: {
  thread: ChatThread;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={'chat-thread' + (selected ? ' is-selected' : '')}>
      <button
        type="button"
        className="chat-thread-main"
        aria-current={selected ? 'true' : undefined}
        onClick={onSelect}
      >
        <span className="chat-thread-title">{thread.title}</span>
        <span className="chat-thread-meta mono">
          /{thread.boundAgentSlug}
          {thread.lastMessageAt !== null && ` · ${formatTime(thread.lastMessageAt)}`}
        </span>
      </button>
      <button
        type="button"
        className="chat-thread-del"
        aria-label={`Delete conversation ${thread.title}`}
        onClick={onDelete}
      >
        ×
      </button>
    </div>
  );
}

function Conversation({ thread, userName }: { thread: ChatThread; userName: string }) {
  const { messages, isLoading } = useMessages(thread.id);
  const send = useSendMessage(thread.id);
  const feedback = useSetFeedback(thread.id);
  const toast = useToast();

  function onRate(messageId: string, rating: 'up' | 'down') {
    // Surface a failed feedback POST (e.g. a 404 on a non-ratable turn) rather than swallowing it —
    // without this the thumb click would do nothing visible. A second rating just replaces the first
    // server-side, so there's nothing to roll back on success.
    feedback.mutate({ messageId, rating }, { onError: (cause) => toast.error(messageFor(cause)) });
  }
  const [text, setText] = useState('');
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ status: ChatTurnStatus; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const composerId = useId();
  const streamRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Conversation is keyed by thread.id, so it remounts on a thread switch — focus the composer then.
  useEffect(() => {
    composerRef.current?.focus();
  }, []);

  // Auto-scroll the transcript to the latest turn whenever it grows or a send is in flight.
  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight });
  }, [messages, pendingText]);

  async function submit() {
    const content = text.trim();
    if (content === '' || send.isPending) return;
    setText('');
    setError(null);
    setNotice(null);
    setPendingText(content);
    try {
      const turn = await send.mutateAsync(content);
      // 'pending' persists no answer — show a notice. 'failed' persists a generic assistant message
      // that the transcript refetch renders, so no separate notice (it would double up). 'succeeded'
      // renders the reply.
      if (turn.status === 'pending') {
        setNotice({
          status: 'pending',
          text: 'The agent escalated this for review — no answer yet.',
        });
      }
    } catch (cause) {
      setError(messageFor(cause));
      setText(content); // restore the unsent message so it isn't lost
    } finally {
      setPendingText(null);
    }
  }

  function onComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline. isComposing: the Enter that commits an IME
    // candidate (CJK/accented input) must not send.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <>
      <header className="chat-head">
        <h1 className="chat-head-title">{thread.title}</h1>
        <span className="chat-head-agent mono">/{thread.boundAgentSlug}</span>
      </header>

      <div
        className="chat-stream"
        ref={streamRef}
        role="log"
        aria-label="Messages"
        aria-live="polite"
      >
        {isLoading ? (
          <SkeletonList rows={3} />
        ) : (
          <>
            {messages.map((m) => (
              <ChatBubble
                key={m.id}
                role={m.role}
                name={m.role === 'assistant' ? thread.boundAgentSlug : userName}
                content={m.content}
                {...(m.role === 'assistant'
                  ? {
                      rating: m.rating,
                      onRate: (r: 'up' | 'down') => onRate(m.id, r),
                      rateDisabled: feedback.isPending,
                    }
                  : {})}
              />
            ))}
            {pendingText !== null && (
              <>
                <ChatBubble role="user" name={userName} content={pendingText} />
                <div className="chat-msg" data-role="assistant">
                  <span className="chat-avatar" aria-hidden="true">
                    {initials(thread.boundAgentSlug)}
                  </span>
                  <div className="chat-msg-body">
                    {/* No aria-live here — the parent role=log already announces it; nesting live
                        regions double-announces. */}
                    <span className="chat-msg-name mono">/{thread.boundAgentSlug}</span>
                    <span className="chat-thinking">Thinking…</span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Notices live OUTSIDE the role=log stream so each owns its own announcement (no nested
          live regions). */}
      {notice !== null && (
        <p className="chat-notice" data-status={notice.status} role="status">
          {notice.text}
        </p>
      )}
      {error !== null && (
        <p className="chat-notice" data-status="failed" role="alert">
          {error}
        </p>
      )}

      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="chat-sr-only" htmlFor={composerId}>
          Message
        </label>
        <textarea
          id={composerId}
          ref={composerRef}
          className="chat-composer-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onComposerKeyDown}
          placeholder={`Message /${thread.boundAgentSlug}…`}
          rows={1}
          disabled={send.isPending}
        />
        <button
          type="submit"
          className="btn"
          data-variant="primary"
          disabled={send.isPending || text.trim() === ''}
        >
          {send.isPending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </>
  );
}

function ChatBubble({
  role,
  name,
  content,
  rating,
  onRate,
  rateDisabled = false,
}: {
  role: 'user' | 'assistant';
  name: string;
  content: string;
  rating?: 'up' | 'down' | null;
  onRate?: (rating: 'up' | 'down') => void;
  rateDisabled?: boolean;
}) {
  return (
    <div className="chat-msg" data-role={role}>
      <span className="chat-avatar" aria-hidden="true">
        {initials(name)}
      </span>
      <div className="chat-msg-body">
        <span className="chat-msg-name mono">{role === 'assistant' ? `/${name}` : name}</span>
        {/* Plain text only — model/user content is never injected as raw HTML (Gate 5). */}
        <p className="chat-msg-text">{content}</p>
        {role === 'assistant' && onRate !== undefined && (
          <div className="chat-feedback">
            <button
              type="button"
              className="chat-fb"
              data-active={rating === 'up' || undefined}
              aria-label="Good response"
              aria-pressed={rating === 'up'}
              disabled={rateDisabled}
              onClick={() => onRate('up')}
            >
              👍
            </button>
            <button
              type="button"
              className="chat-fb"
              data-active={rating === 'down' || undefined}
              aria-label="Bad response"
              aria-pressed={rating === 'down'}
              disabled={rateDisabled}
              onClick={() => onRate('down')}
            >
              👎
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
