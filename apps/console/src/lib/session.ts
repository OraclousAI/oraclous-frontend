// Session hooks. useMe resolves the authenticated principal from the gateway
// (GET /v1/auth/me); useLogout ends the session (clears the in-memory token + cache).
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError, ErrorCode, type AuthPrincipal } from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

function isAuthFailure(error: unknown): boolean {
  return (
    ApiClientError.is(error) &&
    (error.code === ErrorCode.UNAUTHENTICATED || error.code === ErrorCode.UNAUTHORIZED)
  );
}

export interface MeState {
  readonly principal: AuthPrincipal | null;
  readonly isLoading: boolean;
  // True when the token is present but the server rejected it (expired/invalid).
  readonly isAuthError: boolean;
}

export function useMe(): MeState {
  const { auth } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => auth.me(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => !isAuthFailure(error) && failureCount < 1,
  });

  return {
    principal: query.data ?? null,
    isLoading: query.isLoading,
    isAuthError: query.isError && isAuthFailure(query.error),
  };
}

export function useLogout(): () => void {
  const { setToken } = useTokenStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useCallback(() => {
    setToken(null);
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [setToken, queryClient, navigate]);
}
