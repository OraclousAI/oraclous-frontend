// Capability-registry "use a tool" loop: a tool/capability is instantiated, optionally configured
// with credentials, validated for readiness, then executed. NOTE: /execute returns 201 for BOTH
// success and failure — always branch on the returned `status`, never the HTTP code.
import type { ApiTransport } from './transport';

export type InstanceStatus = string; // READY | CONFIGURATION_REQUIRED | ...
export type ExecutionStatus = string; // SUCCESS | FAILED | QUEUED

export interface CreateInstanceInput {
  readonly capabilityId: string;
  readonly name: string;
  readonly description?: string;
}

export interface Instance {
  readonly id: string;
  readonly capabilityId: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: InstanceStatus;
  readonly requiredCredentials: readonly string[];
  readonly credentialMappings: Readonly<Record<string, string>>;
  readonly executionCount: number;
  readonly lastExecutionId: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface ValidationError {
  readonly type: string;
  readonly message: string;
  readonly severity: string;
  readonly credentialType: string | null;
}

export interface ValidationReport {
  readonly isReady: boolean;
  readonly status: InstanceStatus;
  readonly checks: Readonly<Record<string, string>>;
  readonly errors: readonly ValidationError[];
}

export interface Execution {
  readonly id: string;
  readonly instanceId: string;
  readonly status: ExecutionStatus;
  readonly outputData: Readonly<Record<string, unknown>> | null;
  readonly errorMessage: string | null;
  readonly errorType: string | null;
  readonly processingTimeMs: number | null;
  readonly createdAt: string | null;
}

interface InstanceWire {
  readonly id: string;
  readonly capability_id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: string;
  readonly required_credentials: readonly string[];
  readonly credential_mappings: Readonly<Record<string, string>>;
  readonly execution_count: number;
  readonly last_execution_id: string | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
}
interface InstanceListWire {
  readonly instances: readonly InstanceWire[];
  readonly total: number;
}
interface ValidationWire {
  readonly is_ready: boolean;
  readonly status: string;
  readonly checks: Readonly<Record<string, string>>;
  readonly errors?: ReadonlyArray<{
    readonly type: string;
    readonly message: string;
    readonly severity: string;
    readonly credential_type?: string | null;
  }>;
}
interface ExecutionWire {
  readonly id: string;
  readonly instance_id: string;
  readonly status: string;
  readonly output_data: Readonly<Record<string, unknown>> | null;
  readonly error_message: string | null;
  readonly error_type: string | null;
  readonly processing_time_ms: number | null;
  readonly created_at: string | null;
}

export interface InstancesClient {
  list(): Promise<Instance[]>;
  create(input: CreateInstanceInput): Promise<Instance>;
  get(instanceId: string): Promise<Instance>;
  validate(instanceId: string): Promise<ValidationReport>;
  execute(instanceId: string, inputData: Record<string, unknown>): Promise<Execution>;
  getExecution(executionId: string): Promise<Execution>;
}

function toInstance(w: InstanceWire): Instance {
  return {
    id: w.id,
    capabilityId: w.capability_id,
    name: w.name,
    description: w.description,
    status: w.status,
    requiredCredentials: w.required_credentials ?? [],
    credentialMappings: w.credential_mappings ?? {},
    executionCount: w.execution_count,
    lastExecutionId: w.last_execution_id,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

function toExecution(w: ExecutionWire): Execution {
  return {
    id: w.id,
    instanceId: w.instance_id,
    status: w.status,
    outputData: w.output_data,
    errorMessage: w.error_message,
    errorType: w.error_type,
    processingTimeMs: w.processing_time_ms,
    createdAt: w.created_at,
  };
}

export function createInstancesClient(transport: ApiTransport): InstancesClient {
  return {
    async list(): Promise<Instance[]> {
      const { data } = await transport.execute<InstanceListWire>({
        method: 'GET',
        path: '/api/v1/instances',
      });
      const instances = Array.isArray(data?.instances) ? data.instances : [];
      return instances.map(toInstance);
    },
    async create(input: CreateInstanceInput): Promise<Instance> {
      const body: { capability_id: string; name: string; description?: string } = {
        capability_id: input.capabilityId,
        name: input.name,
      };
      if (input.description !== undefined) body.description = input.description;
      const { data } = await transport.execute<InstanceWire>({
        method: 'POST',
        path: '/api/v1/instances',
        body,
      });
      return toInstance(data);
    },
    async get(instanceId: string): Promise<Instance> {
      const { data } = await transport.execute<InstanceWire>({
        method: 'GET',
        path: `/api/v1/instances/${encodeURIComponent(instanceId)}`,
      });
      return toInstance(data);
    },
    async validate(instanceId: string): Promise<ValidationReport> {
      const { data } = await transport.execute<ValidationWire>({
        method: 'GET',
        path: `/api/v1/instances/${encodeURIComponent(instanceId)}/validate-execution`,
      });
      return {
        isReady: data.is_ready,
        status: data.status,
        checks: data.checks ?? {},
        errors: (data.errors ?? []).map((e) => ({
          type: e.type,
          message: e.message,
          severity: e.severity,
          credentialType: e.credential_type ?? null,
        })),
      };
    },
    async execute(instanceId: string, inputData: Record<string, unknown>): Promise<Execution> {
      const { data } = await transport.execute<ExecutionWire>({
        method: 'POST',
        path: `/api/v1/instances/${encodeURIComponent(instanceId)}/execute`,
        body: { input_data: inputData },
      });
      return toExecution(data);
    },
    async getExecution(executionId: string): Promise<Execution> {
      const { data } = await transport.execute<ExecutionWire>({
        method: 'GET',
        path: `/api/v1/executions/${encodeURIComponent(executionId)}`,
      });
      return toExecution(data);
    },
  };
}
