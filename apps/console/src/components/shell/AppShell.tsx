// Layout route component for the /app/* subtree.
// Wraps every authenticated page in ProtectedRoute + DashLayout and exposes <Outlet />.
import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../auth/ProtectedRoute.js';
import { DashLayout } from './DashLayout.js';

export function AppShell({ padded = true }: { padded?: boolean }) {
  return (
    <ProtectedRoute>
      <DashLayout padded={padded}>
        <Outlet />
      </DashLayout>
    </ProtectedRoute>
  );
}
