// Shared formatting for engine-job run surfaces (the agent-detail Runs tab + the Jobs view).
import type { Job } from '@oraclous/api-client';

// The state-dot class for a run row. ESCALATED/CANCELLED read as "warn"; QUEUED/RUNNING as "live".
export function stateRowClass(state: string): string {
  if (state === 'SUCCEEDED') return 'run-row-ok';
  if (state === 'FAILED' || state === 'TIMED_OUT') return 'run-row-fail';
  if (state === 'ESCALATED' || state === 'CANCELLED') return 'run-row-warn';
  return 'run-row-live';
}

export function fmtTime(iso: string | null): string {
  if (iso === null) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleString();
}

// The engine misclassifies manifest-validation failures as harness_unreachable (backend issue
// filed) — the message carries the real detail, so it is the only thing worth showing.
export function jobFailureText(job: Job): string | null {
  if (job.errorMessage !== null && job.errorMessage !== '') return job.errorMessage;
  if (job.state === 'FAILED' || job.state === 'TIMED_OUT') return job.state;
  return null;
}
