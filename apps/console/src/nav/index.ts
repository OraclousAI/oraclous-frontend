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
  IconMessage,
  type IconProps,
} from '../icons/index.js';

export interface NavItem {
  id: string;
  label: string;
  icon?: ComponentType<IconProps>;
  route?: string;
  divider?: boolean;
}

const OWNER: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: IconHome, route: '/app' },
  { id: 'workspaces', label: 'Workspaces', icon: IconLayers, route: '/app/workspaces' },
  { id: 'agents', label: 'Agents', icon: IconBot, route: '/app/agents' },
  { id: 'jobs', label: 'Jobs', icon: IconActivity, route: '/app/jobs' },
  { id: 'tools', label: 'Tools', icon: IconPlug, route: '/app/tools' },
  { id: 'recipes', label: 'Recipes', icon: IconSparkle, route: '/app/recipes' },
  { id: 'mind', label: 'Second Mind', icon: IconMessage, route: '/app/my-space' },
  { id: 'developer', label: 'Developer', icon: IconKey, route: '/app/developer/keys' },
  { id: 'members', label: 'Members', icon: IconUsers, route: '/app/members' },
  { id: 'billing', label: 'Billing', icon: IconCard, route: '/app/billing' },
  { id: 'settings', label: 'Settings', icon: IconCog, route: '/app/settings' },
];

const MEMBER: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: IconHome, route: '/app' },
  { id: 'workspaces', label: 'Workspaces', icon: IconLayers, route: '/app/workspaces' },
  { id: 'agents', label: 'Agents', icon: IconBot, route: '/app/agents' },
  { id: 'jobs', label: 'Jobs', icon: IconActivity, route: '/app/jobs' },
  { id: 'tools', label: 'Tools', icon: IconPlug, route: '/app/tools' },
  { id: 'd1', label: 'Personal', divider: true },
  { id: 'mind', label: 'Second Mind', icon: IconMessage, route: '/app/my-space' },
];

const STANDALONE: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: IconHome, route: '/app' },
  { id: 'workspaces', label: 'Workspaces', icon: IconLayers, route: '/app/workspaces' },
  { id: 'agents', label: 'Agents', icon: IconBot, route: '/app/agents' },
  { id: 'jobs', label: 'Jobs', icon: IconActivity, route: '/app/jobs' },
  { id: 'tools', label: 'Tools', icon: IconPlug, route: '/app/tools' },
  { id: 'recipes', label: 'Recipes', icon: IconSparkle, route: '/app/recipes' },
  { id: 'mind', label: 'Second Mind', icon: IconMessage, route: '/app/my-space' },
  { id: 'developer', label: 'Developer', icon: IconKey, route: '/app/developer/keys' },
  { id: 'billing', label: 'Billing', icon: IconCard, route: '/app/billing' },
  { id: 'settings', label: 'Settings', icon: IconCog, route: '/app/settings' },
];

export const NAV_BY_PERSONA: Record<Persona, NavItem[]> = {
  owner: OWNER,
  member: MEMBER,
  standalone: STANDALONE,
};

export function activeNavId(pathname: string): string {
  if (pathname === '/app' || pathname === '/app/') return 'dashboard';
  if (pathname.startsWith('/app/workspaces')) return 'workspaces';
  if (pathname.startsWith('/app/agents')) return 'agents';
  if (pathname.startsWith('/app/jobs')) return 'jobs';
  if (pathname.startsWith('/app/tools')) return 'tools';
  if (pathname.startsWith('/app/recipes')) return 'recipes';
  if (pathname.startsWith('/app/developer')) return 'developer';
  if (pathname.startsWith('/app/members')) return 'members';
  if (pathname.startsWith('/app/billing')) return 'billing';
  if (pathname.startsWith('/app/settings')) return 'settings';
  if (pathname.startsWith('/app/my-space')) return 'mind';
  return '';
}
