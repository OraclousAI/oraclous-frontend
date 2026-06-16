// Run-detail drawer — a durable job's output and its per-step provenance trace (from the linked
// harness execution). Shared by the agent-detail Runs tab and the Jobs view. The execution
// re-polls while the job is still in flight (an ESCALATED execution's trace changes when a human
// resolves it elsewhere). Tool-step errors render as step states, not run failures.
import { useState } from 'react';
import type { Job } from '@oraclous/api-client';
import { isJobTerminal } from '@oraclous/api-client';
import {
  isRunActive,
  isRunEscalated,
  useAssignments,
  useClaimAssignment,
  useCompleteAssignment,
  useExecution,
  useResumeExecution,
} from '../lib/runs.js';
import { jobFailureText } from '../lib/jobs-format.js';
import '../styles/runs.css';

export function RunDetail({ job }: { job: Job }) {
  const { execution, isLoading } = useExecution(job.harnessExecutionId, isRunActive(job));
  const failure = jobFailureText(job);

  return (
    <div className="run-detail" id="run-detail">
      <div className="sec-h">
        <div className="t">
          <h2>Run {job.id.slice(0, 8)}</h2>
          <span className="sub">
            {job.state}
            {execution !== null && ` · ${execution.iterations} iterations`}
            {execution !== null &&
              execution.totalTokens > 0 &&
              ` · ${execution.totalTokens} tokens`}
          </span>
        </div>
      </div>
      {isRunEscalated(job) && <ResolveEscalation job={job} />}
      {failure !== null && (
        <p
          role="alert"
          className="t-caption"
          style={{ color: 'var(--error)', padding: '10px 20px', margin: 0 }}
        >
          {failure}
        </p>
      )}
      {job.output !== null && job.output !== '' && <pre className="out">{job.output}</pre>}
      {job.harnessExecutionId === null ? (
        <p className="t-caption" style={{ color: 'var(--mute)', padding: '10px 20px', margin: 0 }}>
          {isJobTerminal(job.state)
            ? 'No execution trace was recorded for this run.'
            : 'The step trace appears when the run completes.'}
        </p>
      ) : isLoading ? (
        <p className="t-caption" style={{ color: 'var(--mute)', padding: '10px 20px', margin: 0 }}>
          Loading trace…
        </p>
      ) : execution !== null ? (
        <div role="list" aria-label="Run steps">
          {execution.steps.map((s) => (
            <div
              role="listitem"
              className={`step-row${s.status === 'error' ? ' is-error' : ''}`}
              key={s.index}
            >
              <span className="ix">{String(s.index).padStart(2, '0')}</span>
              <span className="kind">{s.kind}</span>
              <span className="nm">
                {s.name}
                {s.detail !== null && s.detail !== '' && <span className="detail">{s.detail}</span>}
              </span>
              <span className="st">{s.status}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// An ESCALATED run is parked on a human. Two kinds: an entrypoint-actor *assignment* (claim → submit
// output → SUCCEEDED), or a mid-loop HITL *gate pause* (approve resumes the loop, deny → FAILED). We
// disambiguate by whether a PENDING assignment exists for this execution; once claimed it leaves the
// PENDING board, so the complete step is driven off the claim result.
function ResolveEscalation({ job }: { job: Job }) {
  const executionId = job.harnessExecutionId;
  const { assignments, isLoading } = useAssignments(true);
  const claim = useClaimAssignment();
  const complete = useCompleteAssignment();
  const resume = useResumeExecution();
  const [output, setOutput] = useState('');
  const [reason, setReason] = useState('');

  const pending =
    executionId != null ? (assignments.find((a) => a.executionId === executionId) ?? null) : null;
  const claimed = claim.data ?? null;
  const busy = claim.isPending || complete.isPending || resume.isPending;
  const failed = claim.isError || complete.isError || resume.isError;

  const isAssignment = claimed !== null || pending !== null;

  return (
    <div className="run-resolve" role="group" aria-label="Resolve this run">
      <p className="run-resolve-h">Waiting on a human</p>

      {isLoading && !isAssignment ? (
        <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
          Checking the task board…
        </p>
      ) : claimed !== null ? (
        <div className="run-resolve-body">
          <label>
            <span>Your output for this task</span>
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              rows={3}
              placeholder="The result the agent should return…"
            />
          </label>
          <button
            type="button"
            className="btn"
            data-variant="primary"
            data-size="sm"
            disabled={busy || output.trim() === ''}
            onClick={() => complete.mutate({ assignmentId: claimed.id, output: output.trim() })}
          >
            {complete.isPending ? 'Submitting…' : 'Submit output'}
          </button>
        </div>
      ) : pending !== null ? (
        <div className="run-resolve-body">
          <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
            {pending.input}
          </p>
          <button
            type="button"
            className="btn"
            data-variant="primary"
            data-size="sm"
            disabled={busy}
            onClick={() => claim.mutate(pending.id)}
          >
            {claim.isPending ? 'Claiming…' : 'Claim this task'}
          </button>
        </div>
      ) : executionId != null ? (
        <div className="run-resolve-body">
          <label>
            <span>Reason (optional)</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Note for the audit trail"
            />
          </label>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <button
              type="button"
              className="btn"
              data-variant="primary"
              data-size="sm"
              disabled={busy}
              onClick={() => {
                const r = reason.trim();
                resume.mutate(
                  r === ''
                    ? { executionId, decision: 'APPROVED' }
                    : { executionId, decision: 'APPROVED', reason: r }
                );
              }}
            >
              {resume.isPending ? 'Working…' : 'Approve'}
            </button>
            <button
              type="button"
              className="btn"
              data-variant="danger"
              data-size="sm"
              disabled={busy}
              onClick={() => {
                const r = reason.trim();
                resume.mutate(
                  r === ''
                    ? { executionId, decision: 'DENIED' }
                    : { executionId, decision: 'DENIED', reason: r }
                );
              }}
            >
              Deny
            </button>
          </div>
        </div>
      ) : (
        <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
          This run is waiting on a human, but no actionable task was found.
        </p>
      )}

      {failed && (
        <p role="alert" className="t-caption" style={{ color: 'var(--error)', margin: 0 }}>
          Couldn’t complete that action. Please try again.
        </p>
      )}
    </div>
  );
}
