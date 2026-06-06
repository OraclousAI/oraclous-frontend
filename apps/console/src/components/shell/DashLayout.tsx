import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { DashProvider } from '../../context/dash.js';
import { useLogout, useMe, useOrgs } from '../../lib/session.js';
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
  const { orgs, isLoading: orgsLoading } = useOrgs();
  const logout = useLogout();
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  // If the server rejects the token (expired/invalid), end the session and return to /login.
  useEffect(() => {
    if (isAuthError) logout();
  }, [isAuthError, logout]);

  // Close the mobile drawer on navigation and on Escape.
  useEffect(() => setNavOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dashOrgs = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    ownerUserId: o.ownerUserId,
  }));

  return (
    <DashProvider
      email={principal?.email ?? ''}
      userId={principal?.id ?? ''}
      orgs={dashOrgs}
      orgsLoading={orgsLoading}
    >
      <div className="shell-root">
        <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
        {navOpen && (
          <button
            type="button"
            className="shell-backdrop"
            aria-label="Close navigation menu"
            onClick={() => setNavOpen(false)}
          />
        )}
        <div className="shell-maincol">
          <TopBar onMenuClick={() => setNavOpen((v) => !v)} menuOpen={navOpen} />
          <Page padded={padded}>{children}</Page>
        </div>
      </div>
    </DashProvider>
  );
}
