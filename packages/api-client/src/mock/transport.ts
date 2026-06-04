// In-memory mock transport for unit tests (jest / vitest).
// No HTTP calls; handlers are plain functions keyed on "METHOD /path".
// Usage:
//   const { transport, handle, reset } = createMockTransport();
//   handle('GET', '/api/v1/graphs', () => [{ id: '1', name: 'Test' }]);
//   const client = createApiClient({ transport });

import type { ApiTransport, TransportRequest, TransportResponse } from '../transport';
import { ApiClientError } from '../errors';
import type { ApiErrorEnvelope, ErrorCode } from '../errors';

type HandlerFn = (body: unknown) => unknown;

// Key: "METHOD /path"
type HandlerMap = Map<string, HandlerFn>;

export interface MockTransport extends ApiTransport {
  /**
   * Register a persistent handler for METHOD + path.
   * To simulate gateway errors, throw `ApiClientError` — plain `Error` propagates as-is
   * and will not be caught by `ApiClientError.is()` or `error.code` branches in callers.
   */
  handle(method: string, path: string, fn: HandlerFn): void;
  /**
   * Register a one-shot handler consumed on the next matching call.
   * Same error contract as `handle`: throw `ApiClientError`, not plain `Error`.
   */
  handleOnce(method: string, path: string, fn: HandlerFn): void;
  reset(): void;
  calls(): Array<{ method: string; path: string; body: unknown }>;
}

export function createMockTransport(): MockTransport {
  const handlers: HandlerMap = new Map();
  const onceHandlers: Map<string, HandlerFn[]> = new Map();
  const callLog: Array<{ method: string; path: string; body: unknown }> = [];

  function key(method: string, path: string): string {
    // Normalize trailing slashes for matching.
    return `${method.toUpperCase()} ${path.replace(/\/+$/, '')}`;
  }

  const transport: MockTransport = {
    async execute<T>(request: TransportRequest): Promise<TransportResponse<T>> {
      const k = key(request.method, request.path);
      callLog.push({ method: request.method, path: request.path, body: request.body });

      // Check once handlers first.
      const onceQueue = onceHandlers.get(k);
      if (onceQueue && onceQueue.length > 0) {
        const fn = onceQueue.shift() as HandlerFn;
        const result = await fn(request.body);
        return { data: result as T, status: 200 };
      }

      const fn = handlers.get(k);
      if (!fn) {
        const envelope: ApiErrorEnvelope = {
          error: {
            code: 'NOT_FOUND' as ErrorCode,
            message: `Mock: no handler registered for ${k}`,
            requestId: 'mock-req-0',
            retryable: false,
          },
        };
        throw new ApiClientError(envelope, 404);
      }

      const result = await fn(request.body);
      return { data: result as T, status: 200 };
    },

    handle(method, path, fn) {
      handlers.set(key(method, path), fn);
    },

    handleOnce(method, path, fn) {
      const k = key(method, path);
      const queue = onceHandlers.get(k) ?? [];
      queue.push(fn);
      onceHandlers.set(k, queue);
    },

    reset() {
      handlers.clear();
      onceHandlers.clear();
      callLog.length = 0;
    },

    calls() {
      return [...callLog];
    },
  };

  return transport;
}
