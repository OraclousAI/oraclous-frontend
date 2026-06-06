// Dashboard context — persona, current organization, and user identity.
// Current-org selection is held in-memory only (no localStorage) — §3.5 invariant.
// Wire to @oraclous/api-client once it exposes Organization types and auth utilities.
import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';

export type Persona = 'owner' | 'member' | 'standalone';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  // The org's owner — persona is derived by comparing this to the signed-in user's id.
  ownerUserId?: string;
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
  // The signed-in user's id (for per-org owner derivation in the switcher).
  userId: string;
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
  userId: '',
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
  /** Injected at the app layer from the authenticated session. */
  email?: string;
  /** The signed-in user's id — used to derive the owner persona for the current org. */
  userId?: string;
  orgs?: Organization[];
  orgsLoading?: boolean;
}

export function DashProvider({
  children,
  email = '',
  userId = '',
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
    const isOwner = currentOrg !== null && userId !== '' && currentOrg.ownerUserId === userId;
    const persona: Persona = currentOrg ? (isOwner ? 'owner' : 'member') : 'standalone';
    const role: string = isOwner ? 'Owner' : 'Member';
    return {
      persona,
      tenant: {
        type: currentOrg ? 'company' : 'personal',
        name: currentOrg?.name ?? 'Personal',
        plan: currentOrg ? 'team' : 'personal',
      },
      user: {
        name: email ? nameFromEmail(email) : 'Oraclous User',
        email,
        role,
      },
      userId,
      orgs,
      currentOrg,
      orgsLoading,
      setCurrentOrg,
      refetchOrgs,
      canCreateOrg: true,
      needsOnboarding: !orgsLoading && orgs.length === 0,
    };
  }, [email, userId, currentOrg, orgs, orgsLoading, setCurrentOrg, refetchOrgs]);

  return <DashCtx.Provider value={value}>{children}</DashCtx.Provider>;
}
