// Harness-runtime sub-client (/v1/harnesses) — synchronous OHM execution and the execution
// record store. POST /execute blocks until terminal and returns the full per-step trace; the
// durable path is the engine client (POST /v1/engine/jobs), whose jobs link back here via
// harness_execution_id. Shapes bound to harness_schemas.py and live-verified end-to-end.
import type { ApiTransport } from './transport';
import type { OhmManifest } from './ohm';

/** SUCCEEDED | FAILED | ESCALATED (parked for a human). */
export type HarnessExecutionStatus = string;

export interface HarnessStep {
  readonly index: number;
  /** llm | tool | gate */
  readonly kind: string;
  /** The model role for llm steps; "<binding>.<operation>" for tool steps. */
  readonly name: string;
  /** llm: tool_calls | answer; tool: ok | error; gate: the gate reason. */
  readonly status: string;
  readonly detail: string | null;
}

export interface HarnessExecution {
  readonly id: string;
  readonly organisationId: string;
  readonly harnessId: string;
  readonly harnessName: string;
  readonly contentHash: string | null;
  readonly status: HarnessExecutionStatus;
  readonly output: string | null;
  readonly errorType: string | null;
  readonly errorMessage: string | null;
  readonly iterations: number;
  readonly totalTokens: number;
  readonly steps: readonly HarnessStep[];
  readonly createdAt: string | null;
}

/** Exactly one manifest source must be set (the service 422s otherwise). */
export interface ExecuteHarnessInput {
  readonly manifest?: OhmManifest;
  /** A kind:"harness" registry capability id (the saved-agent reference). */
  readonly manifestRef?: string;
  readonly manifestYaml?: string;
  readonly input: string;
}

interface HarnessStepWire {
  readonly index: number;
  readonly kind: string;
  readonly name: string;
  readonly status: string;
  readonly detail?: string | null;
}

interface HarnessExecutionWire {
  readonly id: string;
  readonly organisation_id: string;
  readonly harness_id: string;
  readonly harness_name: string;
  readonly content_hash: string | null;
  readonly status: string;
  readonly output: string | null;
  readonly error_type: string | null;
  readonly error_message: string | null;
  readonly iterations: number;
  readonly total_tokens: number;
  readonly steps?: readonly HarnessStepWire[];
  readonly created_at: string | null;
}

interface ExecutionListWire {
  readonly executions: readonly HarnessExecutionWire[];
  readonly total: number;
}

/** Estimated provider (BYOM) spend for one model — an ESTIMATE of the user's own provider cost,
 * not a platform charge. `estimatedUsd` is null when the model is `unpriced` (no price card);
 * `model` is null for executions that predate the metering (token counts unknown). */
export interface SpendByModel {
  readonly model: string | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly executions: number;
  readonly estimatedUsd: number | null;
  readonly priced: boolean;
}

export interface Spend {
  /** The ISO8601 lower bound echoed back (null = all time). */
  readonly since: string | null;
  readonly currency: string;
  readonly byModel: readonly SpendByModel[];
  readonly totalEstimatedUsd: number;
  readonly totalInputTokens: number;
  readonly totalOutputTokens: number;
  /** Model ids seen with no price card — render their tokens, never a fabricated $. */
  readonly unpricedModels: readonly string[];
}

interface SpendByModelWire {
  readonly model: string | null;
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly executions: number;
  readonly estimated_usd: number | null;
  readonly priced: boolean;
}

interface SpendWire {
  readonly since: string | null;
  readonly currency: string;
  readonly by_model?: readonly SpendByModelWire[];
  readonly total_estimated_usd: number;
  readonly total_input_tokens: number;
  readonly total_output_tokens: number;
  readonly unpriced_models?: readonly string[];
}

export interface HarnessesClient {
  /** Synchronous run — blocks until SUCCEEDED/FAILED/ESCALATED. */
  execute(input: ExecuteHarnessInput): Promise<HarnessExecution>;
  /** The org's executions (no pagination on the wire yet). */
  listExecutions(): Promise<HarnessExecution[]>;
  getExecution(executionId: string): Promise<HarnessExecution>;
  /** Estimated BYOM provider spend, org-scoped; `since` is an ISO8601 lower bound (omit = all time). */
  spend(sinceIso?: string): Promise<Spend>;
}

function toExecution(w: HarnessExecutionWire): HarnessExecution {
  return {
    id: w.id,
    organisationId: w.organisation_id,
    harnessId: w.harness_id,
    harnessName: w.harness_name,
    contentHash: w.content_hash,
    status: w.status,
    output: w.output,
    errorType: w.error_type,
    errorMessage: w.error_message,
    iterations: w.iterations,
    totalTokens: w.total_tokens,
    steps: (w.steps ?? []).map((s) => ({
      index: s.index,
      kind: s.kind,
      name: s.name,
      status: s.status,
      detail: s.detail ?? null,
    })),
    createdAt: w.created_at,
  };
}

export function createHarnessesClient(transport: ApiTransport): HarnessesClient {
  return {
    async execute(input: ExecuteHarnessInput): Promise<HarnessExecution> {
      const body: Record<string, unknown> = { input: input.input };
      if (input.manifest !== undefined) body['manifest'] = input.manifest;
      if (input.manifestRef !== undefined) body['manifest_ref'] = input.manifestRef;
      if (input.manifestYaml !== undefined) body['manifest_yaml'] = input.manifestYaml;
      const { data } = await transport.execute<HarnessExecutionWire>({
        method: 'POST',
        path: '/v1/harnesses/execute',
        body,
      });
      return toExecution(data);
    },
    async listExecutions(): Promise<HarnessExecution[]> {
      const { data } = await transport.execute<ExecutionListWire>({
        method: 'GET',
        path: '/v1/harnesses/executions',
      });
      const executions = Array.isArray(data?.executions) ? data.executions : [];
      return executions.map(toExecution);
    },
    async getExecution(executionId: string): Promise<HarnessExecution> {
      const { data } = await transport.execute<HarnessExecutionWire>({
        method: 'GET',
        path: `/v1/harnesses/executions/${encodeURIComponent(executionId)}`,
      });
      return toExecution(data);
    },
    async spend(sinceIso?: string): Promise<Spend> {
      const qs = sinceIso !== undefined ? `?since=${encodeURIComponent(sinceIso)}` : '';
      const { data } = await transport.execute<SpendWire>({
        method: 'GET',
        path: `/v1/harnesses/spend${qs}`,
      });
      return {
        since: data.since,
        currency: data.currency,
        byModel: (data.by_model ?? []).map((m) => ({
          model: m.model,
          inputTokens: m.input_tokens,
          outputTokens: m.output_tokens,
          executions: m.executions,
          estimatedUsd: m.estimated_usd,
          priced: m.priced,
        })),
        totalEstimatedUsd: data.total_estimated_usd,
        totalInputTokens: data.total_input_tokens,
        totalOutputTokens: data.total_output_tokens,
        unpricedModels: data.unpriced_models ?? [],
      };
    },
  };
}
