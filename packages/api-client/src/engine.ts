// Execution-engine sub-client (/v1/engine) — durable runs. Submit returns 202 QUEUED
// immediately (even though small runs finish in seconds): always poll the job to a terminal
// state. A SUCCEEDED/FAILED job links its full per-step trace via harness_execution_id (the
// harnesses client). Shapes bound to engine_schemas.py and live-verified (202 → poll →
// SUCCEEDED with output + progress 100).
//
// Known wart (backend issue filed): a job whose manifest fails OHM validation surfaces
// error_type "harness_unreachable" with the real 422 detail inside error_message — key UI
// copy off error_message, never error_type.
import type { ApiTransport } from './transport';
import type { OhmManifest } from './ohm';

/** QUEUED | RUNNING | SUCCEEDED | FAILED | ESCALATED | TIMED_OUT | CANCELLED */
export type JobState = string;

const TERMINAL_STATES = new Set(['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'CANCELLED']);

/** True when the job will never change again (ESCALATED is a wait state, not terminal). */
export function isJobTerminal(state: JobState): boolean {
  return TERMINAL_STATES.has(state);
}

export interface Job {
  readonly id: string;
  readonly organisationId: string;
  readonly userId: string;
  readonly state: JobState;
  readonly manifestRef: string | null;
  readonly inputText: string;
  readonly harnessExecutionId: string | null;
  readonly assignmentId: string | null;
  readonly scheduleId: string | null;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly timeoutSeconds: number | null;
  readonly progress: number;
  readonly output: string | null;
  readonly errorType: string | null;
  readonly errorMessage: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

/** Exactly one of manifest | manifestRef (the engine does not accept YAML). */
export interface SubmitJobInput {
  readonly manifest?: OhmManifest;
  readonly manifestRef?: string;
  readonly input: string;
  readonly maxRetries?: number;
  readonly timeoutSeconds?: number;
}

export interface EngineActivityEvent {
  readonly id: string;
  /** e.g. engine.job.submit | engine.job.run */
  readonly action: string;
  /** e.g. "engine_job:<id>" */
  readonly resource: string;
  /** The job state the event recorded (QUEUED | SUCCEEDED | FAILED | ...). */
  readonly outcome: string;
  readonly createdAt: string | null;
}

interface JobWire {
  readonly id: string;
  readonly organisation_id: string;
  readonly user_id: string;
  readonly state: string;
  readonly manifest_ref: string | null;
  readonly input_text: string;
  readonly harness_execution_id: string | null;
  readonly assignment_id: string | null;
  readonly schedule_id: string | null;
  readonly retry_count: number;
  readonly max_retries: number;
  readonly timeout_seconds: number | null;
  readonly progress: number;
  readonly output: string | null;
  readonly error_type: string | null;
  readonly error_message: string | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
}

interface JobListWire {
  readonly jobs: readonly JobWire[];
  readonly total: number;
}

interface ActivityWire {
  readonly events: ReadonlyArray<{
    readonly id: string;
    readonly action: string;
    readonly resource: string;
    readonly outcome: string;
    readonly created_at: string | null;
  }>;
  readonly total: number;
}

export interface EngineClient {
  /** 202: the job is QUEUED — poll getJob(id) until isJobTerminal(state). */
  submitJob(input: SubmitJobInput): Promise<Job>;
  /** Newest-first; the service caps the list at its 50 most recent. */
  listJobs(): Promise<Job[]>;
  getJob(jobId: string): Promise<Job>;
  /** Best-effort: terminal jobs are returned unchanged. */
  cancelJob(jobId: string): Promise<Job>;
  /** Org-level engine provenance feed, newest-first. */
  activity(limit?: number): Promise<EngineActivityEvent[]>;
}

function toJob(w: JobWire): Job {
  return {
    id: w.id,
    organisationId: w.organisation_id,
    userId: w.user_id,
    state: w.state,
    manifestRef: w.manifest_ref,
    inputText: w.input_text,
    harnessExecutionId: w.harness_execution_id,
    assignmentId: w.assignment_id,
    scheduleId: w.schedule_id,
    retryCount: w.retry_count,
    maxRetries: w.max_retries,
    timeoutSeconds: w.timeout_seconds,
    progress: w.progress,
    output: w.output,
    errorType: w.error_type,
    errorMessage: w.error_message,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export function createEngineClient(transport: ApiTransport): EngineClient {
  return {
    async submitJob(input: SubmitJobInput): Promise<Job> {
      const body: Record<string, unknown> = { input: input.input };
      if (input.manifest !== undefined) body['manifest'] = input.manifest;
      if (input.manifestRef !== undefined) body['manifest_ref'] = input.manifestRef;
      if (input.maxRetries !== undefined) body['max_retries'] = input.maxRetries;
      if (input.timeoutSeconds !== undefined) body['timeout_seconds'] = input.timeoutSeconds;
      const { data } = await transport.execute<JobWire>({
        method: 'POST',
        path: '/v1/engine/jobs',
        body,
      });
      return toJob(data);
    },
    async listJobs(): Promise<Job[]> {
      const { data } = await transport.execute<JobListWire>({
        method: 'GET',
        path: '/v1/engine/jobs',
      });
      const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
      return jobs.map(toJob);
    },
    async getJob(jobId: string): Promise<Job> {
      const { data } = await transport.execute<JobWire>({
        method: 'GET',
        path: `/v1/engine/jobs/${encodeURIComponent(jobId)}`,
      });
      return toJob(data);
    },
    async cancelJob(jobId: string): Promise<Job> {
      const { data } = await transport.execute<JobWire>({
        method: 'POST',
        path: `/v1/engine/jobs/${encodeURIComponent(jobId)}/cancel`,
      });
      return toJob(data);
    },
    async activity(limit?: number): Promise<EngineActivityEvent[]> {
      const qs = limit !== undefined ? `?limit=${encodeURIComponent(String(limit))}` : '';
      const { data } = await transport.execute<ActivityWire>({
        method: 'GET',
        path: `/v1/engine/activity${qs}`,
      });
      const events = Array.isArray(data?.events) ? data.events : [];
      return events.map((e) => ({
        id: e.id,
        action: e.action,
        resource: e.resource,
        outcome: e.outcome,
        createdAt: e.created_at ?? null,
      }));
    },
  };
}
