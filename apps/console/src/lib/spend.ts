// Spend hooks — estimated BYOM provider spend (GET /v1/harnesses/spend). This is an ESTIMATE of
// the user's own provider cost (their model keys), org-scoped — never a platform charge. The
// cost-candor surfaces (dashboard KPI, sidebar, billing) bind to it; nothing is fabricated.
import { useQuery } from '@tanstack/react-query';
import type { Spend, SpendByModel } from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

// Start of the current month (UTC) as ISO8601 — the "this month / month-to-date" lower bound.
export function monthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export function formatUsd(amount: number): string {
  // A malformed/non-finite estimate must never surface as "$NaN"/"$∞" — degrade to $0.00.
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(safe);
}

export interface SpendState {
  readonly spend: Spend | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

// Defaults to month-to-date; pass an ISO8601 lower bound to override. `enabled` lets a caller
// skip the fetch entirely (e.g. a member who never sees the spend strip).
export function useSpend(sinceIso?: string, enabled = true): SpendState {
  const { harnesses } = useApi();
  const { isAuthenticated } = useTokenStore();
  const since = sinceIso ?? monthStartIso();

  const query = useQuery({
    queryKey: ['harness-spend', since],
    queryFn: () => harnesses.spend(since),
    enabled: isAuthenticated && enabled,
    staleTime: 60 * 1000,
  });

  return { spend: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}

export interface SpendBuckets {
  // Rows with a known model AND a price card — these carry a real estimated $.
  readonly priced: readonly SpendByModel[];
  // Rows with a known model but no price card — tokens only, never a fabricated $.
  readonly unpriced: readonly SpendByModel[];
  // Executions predating the metering (model === null): counted, but "no spend yet".
  readonly preMeteringExecutions: number;
  // True when there is genuinely nothing to show (no executions at all).
  readonly empty: boolean;
}

// Split the wire rows into the three honest buckets the issue calls for.
export function bucketSpend(spend: Spend | null): SpendBuckets {
  const rows = spend?.byModel ?? [];
  const priced = rows.filter((m) => m.model !== null && m.priced);
  const unpriced = rows.filter((m) => m.model !== null && !m.priced);
  const preMeteringExecutions = rows
    .filter((m) => m.model === null)
    .reduce((n, m) => n + m.executions, 0);
  const totalExecutions = rows.reduce((n, m) => n + m.executions, 0);
  return { priced, unpriced, preMeteringExecutions, empty: totalExecutions === 0 };
}

export interface SpendHeadline {
  readonly amount: string;
  readonly note: string;
  readonly muted: boolean;
}

// The compact headline for the dashboard KPI + sidebar strip: the total is always shown truthfully
// ($0.00 when nothing is costed), with a note that distinguishes real estimated spend, usage on an
// unpriced model (tokens but no $), and nothing-yet. On a failed fetch it degrades to "$—" — never
// a fabricated $0.00 that reads as a real "no spend yet".
export function spendHeadline(spend: Spend | null, loading: boolean, error = false): SpendHeadline {
  if (loading) return { amount: '$—', note: 'loading…', muted: true };
  if (error) return { amount: '$—', note: 'spend unavailable', muted: true };
  const total = spend?.totalEstimatedUsd ?? 0;
  const { unpriced } = bucketSpend(spend);
  const unpricedNote = `${unpriced.length} model${unpriced.length === 1 ? '' : 's'} unpriced`;
  if (total > 0) {
    return {
      amount: formatUsd(total),
      note: unpriced.length > 0 ? `estimated · ${unpricedNote}` : 'estimated provider spend',
      muted: false,
    };
  }
  return {
    amount: formatUsd(total),
    note: unpriced.length > 0 ? unpricedNote : 'no spend yet',
    muted: true,
  };
}
