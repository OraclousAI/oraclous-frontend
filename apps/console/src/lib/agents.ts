// Agent (capability instance) hooks: list/create/read instances, read readiness, run executions,
// and the credential configure flow (create a credential + map it so the instance becomes READY).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCredentialInput,
  Credential,
  CreateInstanceInput,
  Execution,
  Instance,
  ValidationReport,
} from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface InstancesState {
  readonly instances: readonly Instance[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useInstances(): InstancesState {
  const { instances: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['instances'],
    queryFn: () => client.list(),
    enabled: isAuthenticated,
  });

  return { instances: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export interface InstanceState {
  readonly instance: Instance | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useInstance(instanceId: string): InstanceState {
  const { instances: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['instance', instanceId],
    queryFn: () => client.get(instanceId),
    enabled: isAuthenticated && instanceId !== '',
  });

  return { instance: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}

export interface ValidationState {
  readonly report: ValidationReport | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

// `enabled` lets the caller defer the readiness check until the instance is known to exist, so a
// missing/foreign id doesn't fire a second (invisible) 404 alongside the instance fetch.
export function useValidation(instanceId: string, enabled: boolean): ValidationState {
  const { instances: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['instance-validation', instanceId],
    queryFn: () => client.validate(instanceId),
    enabled: isAuthenticated && instanceId !== '' && enabled,
    retry: false,
  });

  return { report: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}

export function useCreateInstance() {
  const { instances: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInstanceInput): Promise<Instance> => client.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instances'] });
    },
  });
}

export function useExecuteInstance(instanceId: string) {
  const { instances: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inputData: Record<string, unknown>): Promise<Execution> =>
      client.execute(instanceId, inputData),
    onSuccess: () => {
      // A run updates the instance's counters/status and may change readiness.
      void queryClient.invalidateQueries({ queryKey: ['instance', instanceId] });
      void queryClient.invalidateQueries({ queryKey: ['instances'] });
      void queryClient.invalidateQueries({ queryKey: ['instance-validation', instanceId] });
    },
  });
}

export function useCreateCredential() {
  const { credentials: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCredentialInput): Promise<Credential> => client.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
  });
}

export function useConfigureCredentials(instanceId: string) {
  const { instances: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mappings: Record<string, string>): Promise<Instance> =>
      client.configureCredentials(instanceId, mappings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instance', instanceId] });
      void queryClient.invalidateQueries({ queryKey: ['instance-validation', instanceId] });
      void queryClient.invalidateQueries({ queryKey: ['instances'] });
    },
  });
}
