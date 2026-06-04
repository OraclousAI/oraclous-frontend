// Dashboard context — persona, current organization, and user identity.
// Current-org selection is held in-memory only (no localStorage) — §3.5 invariant.
// Wire to @oraclous/api-client once it exposes Organization types and auth utilities.
import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';

export type Persona = 'owner' | 'member' | 'standalone';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  org_role?: 'owner' | 'admin' | 'member';
}

export interface DashTenant {
  type: 'company' | 'personal';
  name: string;
  plan: string;
}

export interface DashUser {
  name: string;
  email: string;
  role: string;
  initials?: string;
}

export interface DashContextValue {
  persona: Persona;
  tenant: DashTenant;
  user: DashUser;
  orgs: Organization[];
  currentOrg: Organization | null;
  orgsLoading: boolean;
  setCurrentOrg: (orgId: string) => void;
  refetchOrgs: () => void;
  canCreateOrg: boolean;
  needsOnboarding: boolean;
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || email
  );
}

const FALLBACK: DashContextValue = {
  persona: 'standalone',
  tenant: { type: 'personal', name: 'Personal', plan: 'personal' },
  user: { name: 'Oraclous User', email: '', role: 'Member' },
  orgs: [],
  currentOrg: null,
  orgsLoading: false,
  setCurrentOrg: () => {},
  refetchOrgs: () => {},
  canCreateOrg: false,
  needsOnboarding: false,
};

const DashCtx = createContext<DashContextValue>(FALLBACK);

export const useDash = () => useContext(DashCtx);

export interface DashProviderProps {
  children: ReactNode;
  /** Injected at the app layer once the API client is wired. */
  email?: string;
  orgs?: Organization[];
  orgsLoading?: boolean;
}

export function DashProvider({
  children,
  email = '',
  orgs = [],
  orgsLoading = false,
}: DashProviderProps) {
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  const currentOrg = useMemo<Organization | null>(
    () => orgs.find((o) => o.id === currentOrgId) ?? orgs[0] ?? null,
    [orgs, currentOrgId]
  );

  const setCurrentOrg = useCallback((orgId: string) => {
    setCurrentOrgId(orgId);
  }, []);

  const refetchOrgs = useCallback(() => {}, []);

  const value = useMemo<DashContextValue>(() => {
    const role: string = currentOrg?.org_role
      ? currentOrg.org_role.charAt(0).toUpperCase() + currentOrg.org_role.slice(1)
      : 'Member';
    const persona: Persona = currentOrg
      ? currentOrg.org_role === 'owner'
        ? 'owner'
        : 'member'
      : 'standalone';
    return {
      persona,
      tenant: {
        type: currentOrg ? 'company' : 'personal',
        name: currentOrg?.name ?? 'Personal',
        plan: currentOrg?.org_role ?? 'personal',
      },
      user: {
        name: email ? nameFromEmail(email) : 'Oraclous User',
        email,
        role,
      },
      orgs,
      currentOrg,
      orgsLoading,
      setCurrentOrg,
      refetchOrgs,
      canCreateOrg: true,
      needsOnboarding: !orgsLoading && orgs.length === 0,
    };
  }, [email, currentOrg, orgs, orgsLoading, setCurrentOrg, refetchOrgs]);

  return <DashCtx.Provider value={value}>{children}</DashCtx.Provider>;
}
