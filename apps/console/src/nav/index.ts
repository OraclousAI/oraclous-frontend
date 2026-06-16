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
}

/** A labelled section of the nav: a header + its ordered items. */
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// Item definitions — one source of truth, composed into groups per persona below. The Nav-IA journey
// restructures the grouped spine without changing what each surface does. Connections is now a
// first-class Operate item; Jobs is relabelled Runs and Ask relabelled Explore, both living in Operate
// (increments 2–4), and the transitional "Personal" group is retired. Persona hygiene and dropping the
// legacy /app/jobs + /app/my-space routes land in increment 5.
const dashboard: NavItem = { id: 'dashboard', label: 'Dashboard', icon: IconHome, route: '/app' };
const workspaces: NavItem = {
  id: 'workspaces',
  label: 'Workspaces',
  icon: IconLayers,
  route: '/app/workspaces',
};
const agents: NavItem = { id: 'agents', label: 'Agents', icon: IconBot, route: '/app/agents' };
const runs: NavItem = { id: 'runs', label: 'Runs', icon: IconActivity, route: '/app/runs' };
const tools: NavItem = { id: 'tools', label: 'Tools', icon: IconPlug, route: '/app/tools' };
const recipes: NavItem = {
  id: 'recipes',
  label: 'Recipes',
  icon: IconSparkle,
  route: '/app/recipes',
};
const explore: NavItem = {
  id: 'explore',
  label: 'Explore',
  icon: IconSearch,
  route: '/app/explore',
};
const developer: NavItem = {
  id: 'developer',
  label: 'Developer',
  icon: IconKey,
  route: '/app/developer/keys',
};
const members: NavItem = {
  id: 'members',
  label: 'Members',
  icon: IconUsers,
  route: '/app/members',
};
const billing: NavItem = { id: 'billing', label: 'Billing', icon: IconCard, route: '/app/billing' };
const connections: NavItem = {
  id: 'connections',
  label: 'Connections',
  icon: IconGlobe,
  route: '/app/connections',
};
const settings: NavItem = {
  id: 'settings',
  label: 'Settings',
  icon: IconCog,
  route: '/app/settings',
};

const OWNER: NavGroup[] = [
  { id: 'home', label: 'Home', items: [dashboard] },
  { id: 'build', label: 'Build', items: [agents, tools, recipes] },
  { id: 'operate', label: 'Operate', items: [runs, workspaces, connections, explore] },
  { id: 'admin', label: 'Admin', items: [developer, members, billing, settings] },
];

const MEMBER: NavGroup[] = [
  { id: 'home', label: 'Home', items: [dashboard] },
  { id: 'build', label: 'Build', items: [agents, tools] },
  { id: 'operate', label: 'Operate', items: [runs, workspaces, connections, explore] },
];

const STANDALONE: NavGroup[] = [
  { id: 'home', label: 'Home', items: [dashboard] },
  { id: 'build', label: 'Build', items: [agents, tools, recipes] },
  { id: 'operate', label: 'Operate', items: [runs, workspaces, connections, explore] },
  { id: 'admin', label: 'Admin', items: [developer, billing, settings] },
];

export const NAV_BY_PERSONA: Record<Persona, NavGroup[]> = {
  owner: OWNER,
  member: MEMBER,
  standalone: STANDALONE,
};

export function activeNavId(pathname: string): string {
  if (pathname === '/app' || pathname === '/app/') return 'dashboard';
  if (pathname.startsWith('/app/workspaces')) return 'workspaces';
  if (pathname.startsWith('/app/agents')) return 'agents';
  if (pathname.startsWith('/app/runs') || pathname.startsWith('/app/jobs')) return 'runs';
  if (pathname.startsWith('/app/tools')) return 'tools';
  if (pathname.startsWith('/app/connections')) return 'connections';
  if (pathname.startsWith('/app/recipes')) return 'recipes';
  if (pathname.startsWith('/app/developer')) return 'developer';
  if (pathname.startsWith('/app/members')) return 'members';
  if (pathname.startsWith('/app/billing')) return 'billing';
  if (pathname.startsWith('/app/settings')) return 'settings';
  if (pathname.startsWith('/app/explore') || pathname.startsWith('/app/my-space')) return 'explore';
  return '';
}
