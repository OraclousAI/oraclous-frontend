// ORA-56 gateway error envelope — agreed shape, frozen.
// Source: oraclous-knowledge/flows/interface-contracts.md §3
// The frontend NEVER branches on `message`; always branch on `code`.

export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MALFORMED_REQUEST: 'MALFORMED_REQUEST',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Informational reference set — the ORA-56 codes that gateways typically mark retryable.
 * Do NOT use this to decide retry logic; always read `error.retryable` from the envelope.
 * The server is authoritative; this set exists for documentation, not branching.
 */
export const RETRYABLE_BY_DEFAULT: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  ErrorCode.RATE_LIMITED,
  ErrorCode.SERVICE_UNAVAILABLE,
  ErrorCode.GATEWAY_TIMEOUT,
]);

export interface ApiErrorDetail {
  readonly field: string;
  readonly issue: string;
}

export interface ApiError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly requestId: string;
  readonly retryable: boolean;
  // Present only for VALIDATION_FAILED; undefined otherwise.
  readonly details?: readonly ApiErrorDetail[];
}

export interface ApiErrorEnvelope {
  readonly error: ApiError;
}

export class ApiClientError extends Error {
  override readonly name = 'ApiClientError';
  readonly code: ErrorCode;
  readonly requestId: string;
  readonly retryable: boolean;
  readonly details: readonly ApiErrorDetail[] | undefined;
  readonly httpStatus: number;

  constructor(envelope: ApiErrorEnvelope, httpStatus: number) {
    super(envelope.error.message);
    this.code = envelope.error.code;
    this.requestId = envelope.error.requestId;
    this.retryable = envelope.error.retryable;
    this.details = envelope.error.details;
    this.httpStatus = httpStatus;
  }

  static is(e: unknown): e is ApiClientError {
    return e instanceof ApiClientError;
  }
}
