// Boot-time tenant gate.
// Full subdomain slug resolution (fetchOrganizationBySlug + membership check) is
// gateway-bound and deferred to R6.  On the apex domain the gate is transparent.
import type { ReactNode } from 'react';

export function TenantGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
