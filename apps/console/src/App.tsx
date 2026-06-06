// Console app routing skeleton.
// Feature views are lazy() + Suspense, each rendering PlaceholderView until its slice lands.
// Auth is live: /login signs in against the gateway, and the /app subtree is wrapped in
// ProtectedRoute, which redirects unauthenticated visitors to /login.

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TenantGate } from './components/auth/TenantGate.js';
import { AppShell } from './components/shell/AppShell.js';
import { PlaceholderView } from './components/views/PlaceholderView.js';

const LoginPage = lazy(() => import('./pages/LoginPage.js'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.js'));
const CreateOrgPage = lazy(() => import('./pages/CreateOrgPage.js'));
const GraphDetailPage = lazy(() => import('./pages/GraphDetailPage.js'));

function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 200,
        color: 'var(--mute)',
        fontSize: 13,
      }}
    >
      Loading…
    </div>
  );
}

function lazyPlaceholder(title: string) {
  function PlaceholderPage() {
    return <PlaceholderView title={title} />;
  }
  return lazy(
    (): Promise<{ default: typeof PlaceholderPage }> =>
      Promise.resolve({ default: PlaceholderPage })
  );
}

const Dashboard = lazy(() => import('./pages/DashboardPage.js'));
const Workspaces = lazy(() => import('./pages/WorkspacesPage.js'));
const Agents = lazyPlaceholder('Agents');
const Tools = lazy(() => import('./pages/ToolsPage.js'));
const Members = lazyPlaceholder('Members');
const Billing = lazyPlaceholder('Billing');
const Settings = lazy(() => import('./pages/SettingsPage.js'));
const SecondMind = lazyPlaceholder('Second Mind');
const Explorer = lazyPlaceholder('Explorer');

export function App() {
  return (
    <BrowserRouter>
      <TenantGate>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            }
          />

          {/* Authenticated shell — /app subtree (AppShell self-protects via ProtectedRoute) */}
          <Route path="/app" element={<AppShell />}>
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="orgs/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CreateOrgPage />
                </Suspense>
              }
            />
            <Route
              path="workspaces"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Workspaces />
                </Suspense>
              }
            />
            <Route
              path="workspaces/:graphId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <GraphDetailPage />
                </Suspense>
              }
            />
            <Route
              path="agents"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Agents />
                </Suspense>
              }
            />
            <Route
              path="tools"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Tools />
                </Suspense>
              }
            />
            <Route
              path="members"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Members />
                </Suspense>
              }
            />
            <Route
              path="billing"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Billing />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Settings />
                </Suspense>
              }
            />
            <Route
              path="my-space"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SecondMind />
                </Suspense>
              }
            />
            <Route
              path="workspaces/:workspaceId/explorer"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Explorer />
                </Suspense>
              }
            />
          </Route>

          {/* Redirect root to /app */}
          <Route path="/" element={<AppShell />}>
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              }
            />
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Routes>
      </TenantGate>
    </BrowserRouter>
  );
}
