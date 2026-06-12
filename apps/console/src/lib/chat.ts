// Chat hooks (Second Mind). Threads + transcript are member-scoped queries; sending a message is a
// synchronous mutation that returns the whole turn (the page branches on its status). No streaming;
// per-message thumbs up/down feedback via setFeedback (#313).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatThread, ChatMessage, ChatTurn } from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface ThreadsState {
  readonly threads: readonly ChatThread[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useThreads(): ThreadsState {
  const { chat } = useApi();
  const { isAuthenticated } = useTokenStore();
  const query = useQuery({
    queryKey: ['chat', 'threads'],
    queryFn: () => chat.listThreads(),
    enabled: isAuthenticated,
  });
  return { threads: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export interface MessagesState {
  readonly messages: readonly ChatMessage[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useMessages(threadId: string): MessagesState {
  const { chat } = useApi();
  const { isAuthenticated } = useTokenStore();
  const query = useQuery({
    queryKey: ['chat', 'messages', threadId],
    queryFn: () => chat.listMessages(threadId),
    enabled: isAuthenticated && threadId !== '',
  });
  return { messages: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function useStartThread() {
  const { chat } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { agentSlug: string; title?: string }): Promise<ChatThread> =>
      chat.startThread(input.agentSlug, input.title),
    onSuccess: (thread) => {
      // Insert the new thread into the cache immediately so selecting it doesn't flash the empty
      // state while the list refetches.
      queryClient.setQueryData<ChatThread[]>(['chat', 'threads'], (old) =>
        old ? [thread, ...old.filter((t) => t.id !== thread.id)] : [thread]
      );
      void queryClient.invalidateQueries({ queryKey: ['chat', 'threads'] });
    },
  });
}

export function useSendMessage(threadId: string) {
  const { chat } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string): Promise<ChatTurn> => chat.sendMessage(threadId, content),
    // Return the invalidation promise so mutateAsync resolves only AFTER the transcript refetch
    // lands — the caller can then drop its optimistic bubble without it briefly vanishing.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages', threadId] }),
        queryClient.invalidateQueries({ queryKey: ['chat', 'threads'] }),
      ]),
  });
}

export function useDeleteThread() {
  const { chat } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string): Promise<void> => chat.deleteThread(threadId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat', 'threads'] });
    },
  });
}

export function useSetFeedback(threadId: string) {
  const { chat } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (p: { messageId: string; rating: 'up' | 'down' }): Promise<ChatMessage> =>
      chat.setFeedback(threadId, p.messageId, p.rating),
    // Patch the rated message in place so the thumb highlights immediately (no transcript refetch).
    onSuccess: (updated) => {
      queryClient.setQueryData<ChatMessage[]>(['chat', 'messages', threadId], (old) =>
        old ? old.map((m) => (m.id === updated.id ? updated : m)) : old
      );
    },
  });
}
