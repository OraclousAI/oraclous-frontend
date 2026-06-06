import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TokenStoreProvider } from './lib/token-store.jsx';
import { ApiProvider } from './lib/api.jsx';
import { ToastProvider } from './lib/toast.jsx';
import { App } from './App.js';
// Self-hosted brand fonts (no external CDN). The tokens declare 'Sora' / 'JetBrains Mono'
// as --font-sans / --font-mono; these @font-face imports are what actually load them.
import '@fontsource/sora/400.css';
import '@fontsource/sora/500.css';
import '@fontsource/sora/600.css';
import '@fontsource/sora/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
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
