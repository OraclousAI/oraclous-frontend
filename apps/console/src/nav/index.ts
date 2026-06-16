import type { ComponentType } from 'react';
import type { Persona } from '../context/dash.js';
import {
  IconHome,
  IconLayers,
  IconBot,
  IconActivity,
  IconPlug,
  IconUsers,
  IconCard,
  IconCog,
  IconSparkle,
  IconKey,
  IconGlobe,
  IconSearch,
  type IconProps,
} from '../icons/index.js';

export interface NavItem {
  id: string;
  label: string;
  icon?: ComponentType<IconProps>;
  route?: string;
  /** Personas that see this item. Omit to show it to everyone. */
  personas?: Persona[];
}

/** A labelled section of the nav: a header + its ordered items. */
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// The single grouped source of truth for the nav spine (Nav-IA, increment 5). One ordered definition
// drives every persona: each item carries a `personas` allow-list (omitted = visible to all), and
// navForPersona() filters items then drops any group left empty — replacing the old hand-maintained
// per-persona arrays. Visibility mirrors the prior trees: Recipes is owner/standalone, and the whole
// Admin group is owner/standalone (Members owner-only), so a member sees no Admin section at all.
const NAV: NavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: IconHome, route: '/app' }],
  },
  {
    id: 'build',
    label: 'Build',
    items: [
      { id: 'agents', label: 'Agents', icon: IconBot, route: '/app/agents' },
      { id: 'tools', label: 'Tools', icon: IconPlug, route: '/app/tools' },
      {
        id: 'recipes',
        label: 'Recipes',
        icon: IconSparkle,
        route: '/app/recipes',
        personas: ['owner', 'standalone'],
      },
    ],
  },
  {
    id: 'operate',
    label: 'Operate',
    items: [
      { id: 'runs', label: 'Runs', icon: IconActivity, route: '/app/runs' },
      { id: 'workspaces', label: 'Workspaces', icon: IconLayers, route: '/app/workspaces' },
      { id: 'connections', label: 'Connections', icon: IconGlobe, route: '/app/connections' },
      { id: 'explore', label: 'Explore', icon: IconSearch, route: '/app/explore' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      {
        id: 'members',
        label: 'Members',
        icon: IconUsers,
        route: '/app/members',
        personas: ['owner'],
      },
      {
        id: 'billing',
        label: 'Billing',
        icon: IconCard,
        route: '/app/billing',
        personas: ['owner', 'standalone'],
      },
      {
        id: 'developer',
        label: 'Developer',
        icon: IconKey,
        route: '/app/developer/keys',
        personas: ['owner', 'standalone'],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: IconCog,
        route: '/app/settings',
        personas: ['owner', 'standalone'],
      },
    ],
  },
];

/**
 * The nav groups visible to a persona: each group's items filtered by their `personas` allow-list,
 * and any group left with no items dropped (so no empty section headers render).
 */
export function navForPersona(persona: Persona): NavGroup[] {
  return NAV.map((group) => ({
    ...group,
    items: group.items.filter((it) => it.personas == null || it.personas.includes(persona)),
  })).filter((group) => group.items.length > 0);
}

export function activeNavId(pathname: string): string {
  if (pathname === '/app' || pathname === '/app/') return 'dashboard';
  if (pathname.startsWith('/app/workspaces')) return 'workspaces';
  if (pathname.startsWith('/app/agents')) return 'agents';
  if (pathname.startsWith('/app/runs')) return 'runs';
  if (pathname.startsWith('/app/tools')) return 'tools';
  if (pathname.startsWith('/app/connections')) return 'connections';
  if (pathname.startsWith('/app/recipes')) return 'recipes';
  if (pathname.startsWith('/app/developer')) return 'developer';
  if (pathname.startsWith('/app/members')) return 'members';
  if (pathname.startsWith('/app/billing')) return 'billing';
  if (pathname.startsWith('/app/settings')) return 'settings';
  if (pathname.startsWith('/app/explore')) return 'explore';
  return '';
}
