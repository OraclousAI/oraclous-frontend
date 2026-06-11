// Run-detail drawer — a durable job's output and its per-step provenance trace (from the linked
// harness execution). Shared by the agent-detail Runs tab and the Jobs view. The execution
// re-polls while the job is still in flight (an ESCALATED execution's trace changes when a human
// resolves it elsewhere). Tool-step errors render as step states, not run failures.
import type { Job } from '@oraclous/api-client';
import { isJobTerminal } from '@oraclous/api-client';
import { isRunActive, useExecution } from '../lib/runs.js';
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
