import { useEffect, type ReactNode } from 'react';
import { DashProvider } from '../../context/dash.js';
import { useLogout, useMe } from '../../lib/session.js';
import { TopBar } from './TopBar.js';
import { Sidebar } from './Sidebar.js';
import './shell.css';

export function Page({
  children,
  padded = true,
  scroll = true,
}: {
  children: ReactNode;
  padded?: boolean;
  scroll?: boolean;
}) {
  return (
    <main className="shell-page" style={{ overflowY: scroll ? 'auto' : 'hidden' }}>
      <div className={padded ? 'shell-page-inner' : 'shell-page-inner shell-page-inner--flush'}>
        {children}
      </div>
    </main>
  );
}

export function DashLayout({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  const { principal, isAuthError } = useMe();
  const logout = useLogout();

  // If the server rejects the token (expired/invalid), end the session and return to /login.
  useEffect(() => {
    if (isAuthError) logout();
  }, [isAuthError, logout]);

  return (
    <DashProvider email={principal?.email ?? ''}>
      <div className="shell-root">
        <Sidebar />
        <div className="shell-maincol">
          <TopBar />
          <Page padded={padded}>{children}</Page>
        </div>
      </div>
    </DashProvider>
  );
}
