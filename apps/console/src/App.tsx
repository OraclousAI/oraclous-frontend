// Console app routing skeleton.
// Feature views are lazy() + Suspense, each rendering PlaceholderView until its slice lands.
// Auth is live: /login signs in against the gateway, and the /app subtree is wrapped in
// ProtectedRoute, which redirects unauthenticated visitors to /login.

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TenantGate } from './components/auth/TenantGate.js';
import { AppShell } from './components/shell/AppShell.js';
import { PlaceholderView } from './components/views/PlaceholderView.js';
import { useSessionHydration, useSilentRefresh } from './lib/session.js';

const LoginPage = lazy(() => import('./pages/LoginPage.js'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallbackPage.js'));
const Landing = lazy(() => import('./pages/LandingPage.js'));
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
const Agents = lazy(() => import('./pages/AgentsPage.js'));
const AgentDetail = lazy(() => import('./pages/AgentDetailPage.js'));
const AgentHarnessDetail = lazy(() => import('./pages/AgentHarnessDetailPage.js'));
const AgentBuilder = lazy(() => import('./pages/AgentBuilderPage.js'));
const Jobs = lazy(() => import('./pages/JobsPage.js'));
const Tools = lazy(() => import('./pages/ToolsPage.js'));
const Recipes = lazy(() => import('./pages/RecipesPage.js'));
const Members = lazy(() => import('./pages/MembersPage.js'));
const Billing = lazy(() => import('./pages/BillingPage.js'));
const Settings = lazy(() => import('./pages/SettingsPage.js'));
const SecondMind = lazyPlaceholder('Second Mind');
const Explorer = lazy(() => import('./pages/ExplorerPage.js'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvitePage.js'));

export function App() {
  // Restore the session from the vault on boot (a page refresh stays in the app), then keep it
  // alive by silently refreshing the access token before it expires.
  useSessionHydration();
  useSilentRefresh();

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
          <Route
            path="/signup"
            element={
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="/oauth/:provider/callback"
            element={
              <Suspense fallback={<PageLoader />}>
                <OAuthCallback />
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
              path="agents/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AgentBuilder />
                </Suspense>
              }
            />
            <Route
              path="agents/harness/:capabilityId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AgentHarnessDetail />
                </Suspense>
              }
            />
            <Route
              path="agents/harness/:capabilityId/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AgentBuilder />
                </Suspense>
              }
            />
            <Route
              path="agents/:instanceId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AgentDetail />
                </Suspense>
              }
            />
            <Route
              path="jobs"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Jobs />
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
              path="recipes"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Recipes />
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
              path="accept-invite"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AcceptInvite />
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
              path="workspaces/:graphId/explorer"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Explorer />
                </Suspense>
              }
            />
          </Route>

          {/* Public landing — the first screen; authenticated visitors are sent to /app. */}
          <Route
            path="/"
            element={
              <Suspense fallback={<PageLoader />}>
                <Landing />
              </Suspense>
            }
          />

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
