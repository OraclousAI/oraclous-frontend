import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { DashProvider } from '../../context/dash.js';
import { useLogout, useMe, useOrgs } from '../../lib/session.js';
import { useTokenStore } from '../../lib/token-store.jsx';
import { TopBar } from './TopBar.js';
import { Sidebar } from './Sidebar.js';
import { useDrawerA11y } from './useDrawerA11y.js';
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
  // The active org follows the access-token claim — the gateway's authoritative active org, read
  // directly without a /v1/auth/me round-trip.
  const { activeOrgId } = useTokenStore();
  const { orgs, isLoading: orgsLoading } = useOrgs();
  const logout = useLogout();
  const [navOpen, setNavOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const { pathname } = useLocation();

  // If the server rejects the token (expired/invalid), end the session and return to /login.
  useEffect(() => {
    if (isAuthError) logout();
  }, [isAuthError, logout]);

  // Close the mobile drawer on navigation. Escape, focus-trap, focus-restore, and body
  // scroll-lock while the drawer is open are handled by useDrawerA11y.
  useEffect(() => {
    closeNav();
  }, [pathname, closeNav]);
  useDrawerA11y({
    open: navOpen,
    drawerRef: sidebarRef,
    triggerRef: menuButtonRef,
    onClose: closeNav,
  });

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
      activeOrgId={activeOrgId ?? ''}
      orgs={dashOrgs}
      orgsLoading={orgsLoading}
    >
      <div className="shell-root">
        <Sidebar containerRef={sidebarRef} open={navOpen} onNavigate={closeNav} />
        {navOpen && (
          <button
            type="button"
            className="shell-backdrop"
            aria-label="Close navigation menu"
            onClick={closeNav}
          />
        )}
        <div className="shell-maincol">
          <TopBar
            onMenuClick={() => setNavOpen((v) => !v)}
            menuOpen={navOpen}
            menuButtonRef={menuButtonRef}
          />
          <Page padded={padded}>{children}</Page>
        </div>
      </div>
    </DashProvider>
  );
}
