// Wave-1 core-loop hooks: saved harness agents (registry capabilities), durable engine runs,
// and the per-step execution trace. (Tool-INSTANCE hooks — the registry's single-tool run
// path — live in lib/agents.ts.) Polling is tiered: 2s while anything is queued/running, 15s
// when only human-parked (ESCALATED) jobs remain, and a slow 60s heartbeat when quiet — the
// idle tick is the only wake path for runs submitted outside this tab (focus refetch is
// globally off).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  HarnessAssignment,
  HarnessCapability,
  HarnessExecution,
  Job,
  OhmManifest,
  ResumeDecision,
} from '@oraclous/api-client';
import { isJobTerminal } from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

// A run still in flight (its state/progress will change). ESCALATED is a wait state — it can
// resolve without our input (a human approves elsewhere), so it counts as in-flight here; the
// UI presents it separately ("waiting on human"), never as running.
export function isRunActive(job: Job): boolean {
  return !isJobTerminal(job.state);
}

export function isRunEscalated(job: Job): boolean {
  return job.state === 'ESCALATED';
}

export interface HarnessAgentsState {
  readonly agents: readonly HarnessCapability[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useHarnessAgents(): HarnessAgentsState {
  const { capabilities: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['harness-agents'],
    queryFn: () => client.listHarnesses(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  return { agents: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export interface HarnessAgentState {
  readonly agent: HarnessCapability | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useHarnessAgent(capabilityId: string): HarnessAgentState {
  const { capabilities: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['harness-agent', capabilityId],
    queryFn: () => client.get(capabilityId),
    enabled: isAuthenticated && capabilityId !== '',
  });

  return { agent: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}

export function useCreateHarnessAgent() {
  const { capabilities: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (manifest: OhmManifest): Promise<HarnessCapability> =>
      client.createHarness(manifest),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['harness-agents'] });
    },
  });
}

export function useUpdateHarnessAgent(capabilityId: string) {
  const { capabilities: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (manifest: OhmManifest): Promise<HarnessCapability> =>
      client.updateHarness(capabilityId, manifest),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['harness-agents'] });
      void queryClient.invalidateQueries({ queryKey: ['harness-agent', capabilityId] });
    },
  });
}

export function useDeleteHarnessAgent() {
  const { capabilities: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (capabilityId: string): Promise<void> => client.remove(capabilityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['harness-agents'] });
    },
  });
}

export interface JobsState {
  readonly jobs: readonly Job[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

// The org's engine jobs (newest-first, service-capped at 50), polled on the tiered cadence.
export function useJobs(): JobsState {
  const { engine: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['engine-jobs'],
    queryFn: () => client.listJobs(),
    enabled: isAuthenticated,
    refetchInterval: (q) => {
      const jobs = q.state.data ?? [];
      if (jobs.some((j) => isRunActive(j) && !isRunEscalated(j))) return 2000;
      if (jobs.some(isRunEscalated)) return 15000;
      return 60000;
    },
  });

  return { jobs: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export interface SingleJobState {
  readonly job: Job | null;
  readonly isLoading: boolean;
}

// One job by id — the run drawer's fallback when its job leaves the capped list (or right
// after submit, before the list refetch lands). Polls itself while the job is in flight.
export function useJob(jobId: string | null): SingleJobState {
  const { engine: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['engine-job', jobId],
    queryFn: () => client.getJob(jobId ?? ''),
    enabled: isAuthenticated && jobId !== null && jobId !== '',
    refetchInterval: (q) => (q.state.data && isRunActive(q.state.data) ? 2000 : false),
  });

  return { job: query.data ?? null, isLoading: query.isLoading };
}

export function useSubmitJob() {
  const { engine: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { manifestRef: string; input: string }): Promise<Job> =>
      client.submitJob(input),
    onSuccess: () => {
      // The QUEUED job appears in the list; the list's poll then drives it to terminal.
      void queryClient.invalidateQueries({ queryKey: ['engine-jobs'] });
    },
  });
}

export function useCancelJob() {
  const { engine: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string): Promise<Job> => client.cancelJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['engine-jobs'] });
    },
  });
}

export interface ExecutionsState {
  readonly executions: readonly HarnessExecution[];
  readonly isLoading: boolean;
}

// The org's harness executions (each carries its full step trace). Used to enrich the runs table
// with a per-row step summary without a fetch per row — one list call, matched to jobs by
// harnessExecutionId. Polls while any run is in flight (a running trace grows; an escalated one
// changes when a human resolves it).
export function useExecutions(live = false): ExecutionsState {
  const { harnesses: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['harness-executions-list'],
    queryFn: () => client.listExecutions(),
    enabled: isAuthenticated,
    refetchInterval: live ? 2000 : false,
  });

  return { executions: query.data ?? [], isLoading: query.isLoading };
}

export interface ExecutionState {
  readonly execution: HarnessExecution | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

// The per-step trace behind a job (via its harness_execution_id), or a sync run's record.
// Pass live=true while the owning job is non-terminal (an ESCALATED execution's trace changes
// when a human resolves it elsewhere).
export function useExecution(executionId: string | null, live = false): ExecutionState {
  const { harnesses: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['harness-execution', executionId],
    queryFn: () => client.getExecution(executionId ?? ''),
    enabled: isAuthenticated && executionId !== null && executionId !== '',
    refetchInterval: live ? 2000 : false,
  });

  return { execution: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}

// ── Resolve an escalated run (human task board + mid-loop HITL pause) ─────────

export interface AssignmentsState {
  readonly assignments: readonly HarnessAssignment[];
  readonly isLoading: boolean;
}

// The org's PENDING human-actor task-board assignments. Enabled only when something is waiting on a
// human (the caller passes `enabled`), polled on the escalated cadence; a claim/complete invalidates it.
export function useAssignments(enabled = true): AssignmentsState {
  const { harnesses: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['harness-assignments'],
    queryFn: () => client.listAssignments(),
    enabled: isAuthenticated && enabled,
    refetchInterval: enabled ? 15000 : false,
  });

  return { assignments: query.data ?? [], isLoading: query.isLoading };
}

// A run leaving ESCALATED changes the job state, the assignment board, and the execution trace — so a
// resolution refreshes all three (which also drives the "waiting on human" KPI down).
function invalidateRunState(qc: ReturnType<typeof useQueryClient>): void {
  void qc.invalidateQueries({ queryKey: ['engine-jobs'] });
  void qc.invalidateQueries({ queryKey: ['harness-assignments'] });
  void qc.invalidateQueries({ queryKey: ['harness-executions-list'] });
  void qc.invalidateQueries({ queryKey: ['harness-execution'] });
}

export function useClaimAssignment() {
  const { harnesses: client } = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string): Promise<HarnessAssignment> =>
      client.claimAssignment(assignmentId),
    // Claiming moves it off the PENDING board; the complete step is driven off this result.
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['harness-assignments'] });
    },
  });
}

export function useCompleteAssignment() {
  const { harnesses: client } = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { assignmentId: string; output: string }): Promise<HarnessAssignment> =>
      client.completeAssignment(vars.assignmentId, vars.output),
    onSuccess: () => invalidateRunState(qc),
  });
}

export function useResumeExecution() {
  const { harnesses: client } = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      executionId: string;
      decision: ResumeDecision;
      reason?: string;
    }): Promise<HarnessExecution> =>
      client.resumeExecution(vars.executionId, vars.decision, vars.reason),
    onSuccess: () => invalidateRunState(qc),
  });
}
