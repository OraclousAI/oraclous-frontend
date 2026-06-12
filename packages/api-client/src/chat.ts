// Chat sub-client (application-gateway-service, /v1/chat — served directly, member-JWT only). A
// thread is a conversation bound to a published-agent slug; sending a message runs the agent
// SYNCHRONOUSLY and returns the full turn (no streaming). The turn's outcome is in `status`, not
// the HTTP code: 'succeeded' carries the assistant message; 'pending' is an escalated/HITL turn
// with no answer yet; 'failed' carries a generic assistant message (the raw error is never sent).
import type { ApiTransport } from './transport';

export interface ChatThread {
  readonly id: string;
  readonly boundAgentSlug: string; // the published-agent slug this thread talks to
  readonly title: string;
  readonly lastMessageAt: string | null;
  readonly createdAt: string | null;
}

export interface ChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly executionId: string | null;
  readonly totalTokens: number | null;
  readonly createdAt: string | null;
}

export type ChatTurnStatus = 'succeeded' | 'pending' | 'failed';

export interface ChatTurn {
  readonly status: ChatTurnStatus;
  readonly message: ChatMessage | null; // null when pending; a generic assistant message when failed
  readonly executionId: string | null;
}

interface ThreadWire {
  id: string;
  bound_agent_slug: string;
  title: string;
  last_message_at: string | null;
  created_at: string | null;
}

interface MessageWire {
  id: string;
  role: string;
  content: string;
  execution_id: string | null;
  total_tokens: number | null;
  created_at: string | null;
}

interface ChatTurnWire {
  status: string;
  message: MessageWire | null;
  execution_id: string | null;
}

function toThread(w: ThreadWire): ChatThread {
  return {
    id: w.id,
    boundAgentSlug: w.bound_agent_slug,
    title: w.title,
    lastMessageAt: w.last_message_at,
    createdAt: w.created_at,
  };
}

function toMessage(w: MessageWire): ChatMessage {
  return {
    id: w.id,
    role: w.role === 'assistant' ? 'assistant' : 'user',
    content: w.content,
    executionId: w.execution_id,
    totalTokens: w.total_tokens,
    createdAt: w.created_at,
  };
}

function toTurn(w: ChatTurnWire): ChatTurn {
  const status: ChatTurnStatus =
    w.status === 'succeeded' || w.status === 'pending' || w.status === 'failed'
      ? w.status
      : 'failed';
  return {
    status,
    message: w.message !== null ? toMessage(w.message) : null,
    executionId: w.execution_id,
  };
}

export interface ChatClient {
  // Start a thread bound to an active published-agent slug. 404 if no such active agent.
  startThread(agentSlug: string, title?: string): Promise<ChatThread>;
  // The caller's own threads, most-recent context. Bare array.
  listThreads(): Promise<ChatThread[]>;
  // Send a message; the agent runs synchronously and the turn is returned (branch on status).
  sendMessage(threadId: string, content: string): Promise<ChatTurn>;
  // The thread's transcript, oldest → newest. Bare array.
  listMessages(threadId: string): Promise<ChatMessage[]>;
  // Soft-delete a thread. 204; a second delete 404s.
  deleteThread(threadId: string): Promise<void>;
}

export function createChatClient(transport: ApiTransport): ChatClient {
  return {
    async startThread(agentSlug: string, title?: string): Promise<ChatThread> {
      const body: { agent_slug: string; title?: string } = { agent_slug: agentSlug };
      if (title !== undefined && title !== '') body.title = title;
      const { data } = await transport.execute<ThreadWire>({
        method: 'POST',
        path: '/v1/chat/threads',
        body,
      });
      return toThread(data);
    },
    async listThreads(): Promise<ChatThread[]> {
      const { data } = await transport.execute<ThreadWire[]>({
        method: 'GET',
        path: '/v1/chat/threads',
      });
      return (Array.isArray(data) ? data : []).map(toThread);
    },
    async sendMessage(threadId: string, content: string): Promise<ChatTurn> {
      const { data } = await transport.execute<ChatTurnWire>({
        method: 'POST',
        path: `/v1/chat/threads/${encodeURIComponent(threadId)}/messages`,
        body: { content },
      });
      return toTurn(data);
    },
    async listMessages(threadId: string): Promise<ChatMessage[]> {
      const { data } = await transport.execute<MessageWire[]>({
        method: 'GET',
        path: `/v1/chat/threads/${encodeURIComponent(threadId)}/messages`,
      });
      return (Array.isArray(data) ? data : []).map(toMessage);
    },
    async deleteThread(threadId: string): Promise<void> {
      await transport.execute<void>({
        method: 'DELETE',
        path: `/v1/chat/threads/${encodeURIComponent(threadId)}`,
      });
    },
  };
}
