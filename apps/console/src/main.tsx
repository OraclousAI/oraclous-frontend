import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TokenStoreProvider, type TokenPayload } from './lib/token-store.jsx';
import { App } from './App.js';
import '@oraclous/design-system/tokens.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// In development: seed a mock token so the shell renders without live auth.
// Live auth (gateway-bound OAuth / password flow) is wired in R6 and replaces this.
const devToken: TokenPayload | null = import.meta.env.DEV
  ? {
      token: 'mock-token-dev',
      email: 'dev@oraclous.ai',
      expiresAt: Number.POSITIVE_INFINITY,
    }
  : null;

const rootEl = document.getElementById('root');
if (rootEl == null) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <TokenStoreProvider initialToken={devToken}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </TokenStoreProvider>
  </StrictMode>
);
