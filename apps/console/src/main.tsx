import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TokenStoreProvider } from './lib/token-store.jsx';
import { ApiProvider } from './lib/api.jsx';
import { ToastProvider } from './lib/toast.jsx';
import { App } from './App.js';
import '@oraclous/design-system/tokens.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const rootEl = document.getElementById('root');
if (rootEl == null) throw new Error('Root element #root not found');

// Auth is real: the session starts empty; ProtectedRoute sends the user to /login,
// and LoginPage exchanges credentials at the gateway for a token held in memory only.
createRoot(rootEl).render(
  <StrictMode>
    <TokenStoreProvider>
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ApiProvider>
      </QueryClientProvider>
    </TokenStoreProvider>
  </StrictMode>
);
