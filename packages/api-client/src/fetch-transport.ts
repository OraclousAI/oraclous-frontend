// The real gateway transport. This is the ONLY place a bare fetch is allowed
// (Gate 1: api-client-boundary). Base URL + auth-token injection are constructor
// concerns; every 4xx/5xx is surfaced as an ApiClientError carrying the ORA-56/ORA-37
// envelope, and network/parse failures are synthesised into a conformant envelope so
// callers always branch on `code`, never on transport internals.

import { ApiClientError, ErrorCode, type ApiErrorDetail, type ApiErrorEnvelope } from './errors';
import type { ApiTransport, TransportRequest, TransportResponse } from './transport';

export interface FetchTransportOptions {
  // Gateway origin, e.g. http://localhost:8006 (no trailing slash required).
  readonly baseUrl: string;
  // Returns the current bearer token, or null when unauthenticated (e.g. the login call).
  readonly getToken?: () => string | null;
  // Injectable for tests; defaults to the global fetch.
  readonly fetchImpl?: typeof fetch;
}

function synthetic(code: ErrorCode, message: string, retryable: boolean): ApiErrorEnvelope {
  return { error: { code, message, requestId: 'req_clientsynthetic', retryable } };
}

function isEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const err = (value as { error: unknown }).error;
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { code?: unknown }).code === 'string' &&
    typeof (err as { message?: unknown }).message === 'string'
  );
}

// HTTP status → ORA-56 code, for error bodies that are NOT the ORA-56 envelope (a raw FastAPI
// {detail: "..."} from a proxied service, or a 422 validation body). Anything unmapped is INTERNAL_ERROR.
function codeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.MALFORMED_REQUEST;
    case 401:
      return ErrorCode.UNAUTHENTICATED;
    case 403:
      return ErrorCode.UNAUTHORIZED;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 405:
      return ErrorCode.METHOD_NOT_ALLOWED;
    case 409:
      return ErrorCode.CONFLICT;
    case 413:
      return ErrorCode.PAYLOAD_TOO_LARGE;
    case 415:
      return ErrorCode.UNSUPPORTED_MEDIA_TYPE;
    case 422:
      return ErrorCode.VALIDATION_FAILED;
    case 429:
      return ErrorCode.RATE_LIMITED;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    case 504:
      return ErrorCode.GATEWAY_TIMEOUT;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}

// FastAPI request-validation rows: { loc: [...], msg, type }. The gateway does not (yet) map 422
// onto the ORA-56 envelope (oraclous-backend #281), so the client does it here — otherwise every
// form 422 (slug/CORS/binding-XOR validation) surfaces as a generic "unexpected error". Drops the
// leading loc segment ('body'/'query'/'path') so the field reads like the request field.
function detailRowsToErrorDetails(rows: readonly unknown[]): ApiErrorDetail[] {
  const out: ApiErrorDetail[] = [];
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue;
    const r = row as { loc?: unknown; msg?: unknown };
    const loc = Array.isArray(r.loc) ? r.loc : [];
    const segs = (loc[0] === 'body' || loc[0] === 'query' || loc[0] === 'path' ? loc.slice(1) : loc)
      .map((s) => String(s))
      .filter((s) => s !== '');
    const field = segs.length > 0 ? segs.join('.') : '(request)';
    const issue = typeof r.msg === 'string' && r.msg !== '' ? r.msg : 'invalid value';
    out.push({ field, issue });
  }
  return out;
}

// Picks the first human-readable issue for the envelope's top-level message (callers branch on
// `code`, never on `message`, but a real message beats "An unexpected error occurred").
function messageFromDetails(details: readonly ApiErrorDetail[]): string {
  const first = details[0];
  if (first === undefined) return 'The request could not be validated.';
  return first.field === '(request)' ? first.issue : `${first.field}: ${first.issue}`;
}

async function envelopeFrom(response: Response): Promise<ApiErrorEnvelope> {
  try {
    const body: unknown = await response.json();
    if (isEnvelope(body)) return body;
    // FastAPI default error shapes (not the ORA-56 envelope) — a 422 validation list, or a
    // plain-string detail from a proxied service. Map both onto the envelope so callers still
    // branch on `code` and get a usable message/details.
    if (typeof body === 'object' && body !== null && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail;
      if (Array.isArray(detail)) {
        const details = detailRowsToErrorDetails(detail);
        return {
          error: {
            code: codeForStatus(response.status),
            message: messageFromDetails(details),
            requestId: 'req_clientsynthetic',
            retryable: false,
            details,
          },
        };
      }
      if (typeof detail === 'string' && detail !== '') {
        return synthetic(codeForStatus(response.status), detail, false);
      }
    }
  } catch {
    // fall through to a synthesised envelope
  }
  return synthetic(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred.', false);
}

export function createFetchTransport(options: FetchTransportOptions): ApiTransport {
  const root = options.baseUrl.replace(/\/+$/, '');
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async execute<T>(request: TransportRequest): Promise<TransportResponse<T>> {
      const headers: Record<string, string> = { Accept: 'application/json' };
      const token = options.getToken?.() ?? null;
      if (token !== null && token !== '') headers['Authorization'] = `Bearer ${token}`;
      const hasBody = request.body !== undefined && request.method !== 'GET';
      // Multipart (file upload): pass the FormData through untouched — the browser sets
      // Content-Type with the correct boundary, so we must NOT set it or JSON-stringify.
      const isMultipart =
        hasBody && typeof FormData !== 'undefined' && request.body instanceof FormData;
      if (hasBody && !isMultipart) headers['Content-Type'] = 'application/json';
      if (request.headers) Object.assign(headers, request.headers);

      let response: Response;
      try {
        response = await fetchImpl(root + request.path, {
          method: request.method,
          headers,
          ...(hasBody
            ? { body: isMultipart ? (request.body as FormData) : JSON.stringify(request.body) }
            : {}),
          ...(request.signal ? { signal: request.signal } : {}),
        });
      } catch {
        throw new ApiClientError(
          synthetic(ErrorCode.SERVICE_UNAVAILABLE, 'Unable to reach the server.', true),
          0
        );
      }

      if (!response.ok) {
        throw new ApiClientError(await envelopeFrom(response), response.status);
      }

      const data =
        response.status === 204 ? (undefined as unknown as T) : ((await response.json()) as T);
      return { data, status: response.status };
    },
  };
}
