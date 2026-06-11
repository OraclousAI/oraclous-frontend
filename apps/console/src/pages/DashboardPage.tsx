// Dashboard — the /app landing, composed per the handoff dashboard.html mockup:
// greeting hero, KPI row, workspace hierarchy + activity, quick actions + graph preview.
// Everything rendered is real session/org/graph data; surfaces whose backing API lands in
// later waves (activity stream, spend) show honest placeholders, not fabricated numbers.
import { Link } from 'react-router-dom';
import type { Graph } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import { useGraphs } from '../lib/graphs.js';
import { spendHeadline, useSpend } from '../lib/spend.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import {
  IconActivity,
  IconArrowUpRight,
  IconBot,
  IconCard,
  IconChevRight,
  IconCog,
  IconDatabase,
  IconLayers,
  IconPlus,
  IconSparkle,
  IconUsers,
} from '../icons/index.js';
import './dashboard.css';

type TreeState = 'active' | 'paused' | 'error';

// Conservative mapping from the service's status string to the tree/live visual state.
function statusState(status: string): TreeState {
  const s = status.toLowerCase();
  if (s.includes('error') || s.includes('fail')) return 'error';
  if (s === 'active' || s === 'ready' || s === 'processing' || s === 'running') return 'active';
  return 'paused';
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const nf = new Intl.NumberFormat();

// Decorative satellite positions for the graph preview (hub at 200,140 in a 400×280 viewBox).
const SATELLITES = [
  { x: 90, y: 60, r: 9 },
  { x: 320, y: 55, r: 11 },
  { x: 60, y: 100, r: 7 },
  { x: 340, y: 105, r: 6 },
  { x: 40, y: 140, r: 6 },
  { x: 70, y: 180, r: 6 },
  { x: 325, y: 190, r: 6 },
  { x: 115, y: 240, r: 8 },
  { x: 200, y: 250, r: 6 },
  { x: 285, y: 240, r: 7 },
] as const;

function GraphPreviewArt({ graph }: { graph: Graph }) {
  const live = statusState(graph.status) === 'active';
  // Scale how many satellites light up with the (real) node count — purely decorative.
  const litCount = Math.min(3, Math.max(live ? 1 : 0, Math.floor(Math.log10(graph.nodeCount + 1))));
  return (
    <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <radialGradient id="dash-hub-glow" cx="0.5" cy="0.5">
          <stop offset="0" stopColor="#10D88A" stopOpacity="0.45" />
          <stop offset="1" stopColor="#10D88A" stopOpacity="0" />
        </radialGradient>
      </defs>
      {SATELLITES.map((s, i) => (
        <line
          key={`e${i}`}
          x1="200"
          y1="140"
          x2={s.x}
          y2={s.y}
          stroke={i < litCount ? '#10D88A' : '#1E2638'}
          strokeWidth={i < litCount ? 1.2 : 0.8}
          strokeDasharray={i < litCount ? '6 3' : undefined}
        />
      ))}
      {live && <circle cx="200" cy="140" r="48" fill="url(#dash-hub-glow)" />}
      <circle cx="200" cy="140" r="18" fill={live ? '#10D88A' : '#11192A'} stroke="#2A3247" />
      <text
        x="200"
        y="175"
        fontSize="9"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fill="#F4F4F2"
      >
        {graph.name}
      </text>
      {SATELLITES.map((s, i) => (
        <circle
          key={`n${i}`}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={i < litCount ? '#10D88A' : '#11192A'}
          stroke={i < litCount ? undefined : '#2A3247'}
        />
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  const { user, persona, currentOrg, tenant } = useDash();
  const { graphs, isLoading } = useGraphs();
  const { spend, isLoading: spendLoading, isError: spendError } = useSpend();
  const spendHead = spendHeadline(spend, spendLoading, spendError);

  const sorted = [...graphs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const treeItems = sorted.slice(0, 6);
  const newest = sorted[0];

  const totalNodes = graphs.reduce((n, g) => n + g.nodeCount, 0);
  const totalEdges = graphs.reduce((n, g) => n + g.relationshipCount, 0);
  const activeCount = graphs.filter((g) => statusState(g.status) === 'active').length;
  const otherCount = graphs.length - activeCount;

  const dateline = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const lastSync = newest !== undefined ? relTime(newest.updatedAt) : '';

  const orgInitials = (currentOrg?.name ?? 'Personal')
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const quickActions = [
    {
      to: '/app/workspaces',
      icon: IconLayers,
      title: 'New workspace',
      sub: 'Spin up a graph',
    },
    { to: '/app/agents', icon: IconBot, title: 'Configure agent', sub: 'Set tools + scope' },
    { to: '/app/tools', icon: IconDatabase, title: 'Connect a source', sub: 'Browse connectors' },
    ...(persona === 'member'
      ? [{ to: '/app/my-space', icon: IconSparkle, title: 'Second Mind', sub: 'Personal space' }]
      : [
          {
            to: '/app/recipes',
            icon: IconSparkle,
            title: 'Browse recipes',
            sub: 'Ingestion presets',
          },
          ...(persona === 'owner'
            ? [{ to: '/app/members', icon: IconUsers, title: 'Invite member', sub: 'Scope-aware' }]
            : [{ to: '/app/settings', icon: IconCog, title: 'Settings', sub: 'Workspace config' }]),
          { to: '/app/billing', icon: IconCard, title: 'Billing', sub: 'Spend + budget' },
        ]),
  ];

  return (
    <div className="dash-page">
      {/* Greeting hero */}
      <section className="dash-hero" aria-label="Overview">
        <div className="meta">
          <span>
            {timeGreeting()}, {user.name}
          </span>
          <span className="sep" aria-hidden="true" />
          <span>{dateline}</span>
        </div>
        <h1>{currentOrg !== null ? currentOrg.name : tenant.name}</h1>
        <p className="sub">
          {graphs.length} workspace{graphs.length === 1 ? '' : 's'} · {nf.format(totalNodes)} graph
          nodes · {nf.format(totalEdges)} relationships
          {lastSync !== '' ? ` · last update ${lastSync}` : ''}
        </p>
      </section>

      {/* KPI row */}
      <section className="kpis" aria-label="Key numbers">
        <div className="kpi">
          <span className="l">Workspaces</span>
          <span className="v">{graphs.length}</span>
          <span className="s">
            {activeCount} active{otherCount > 0 ? ` · ${otherCount} idle` : ''}
          </span>
        </div>
        <div className="kpi">
          <span className="l">Graph nodes</span>
          <span className="v">{nf.format(totalNodes)}</span>
          <span className="s">across all workspaces</span>
        </div>
        <div className="kpi">
          <span className="l">Relationships</span>
          <span className="v">{nf.format(totalEdges)}</span>
          <span className="s">across all workspaces</span>
        </div>
        <div className="kpi">
          <span className="l">Month-to-date · cost</span>
          <span className={'v' + (spendHead.muted ? ' is-mute' : '')}>{spendHead.amount}</span>
          <span className="s">{spendHead.note}</span>
        </div>
      </section>

      {/* Row 1 — hierarchy + activity */}
      <section className="dash-row-1">
        <div className="card">
          <div className="card-head">
            <div className="h">
              <h2>Workspace hierarchy</h2>
              <span className="sub">Live status across your workspaces</span>
            </div>
            <Link to="/app/workspaces" className="btn" data-variant="secondary" data-size="sm">
              <IconPlus size={14} /> New workspace
            </Link>
          </div>
          <div className="card-body no-pad">
            {isLoading ? (
              <div style={{ padding: 'var(--sp-4)' }}>
                <SkeletonList rows={3} />
              </div>
            ) : graphs.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">
                  <IconLayers size={24} />
                </span>
                <span className="t">No workspaces yet</span>
                <span className="s">
                  Create your first workspace to start building a knowledge graph.
                </span>
                <Link
                  to="/app/workspaces"
                  className="btn"
                  data-variant="primary"
                  data-size="sm"
                  style={{ marginTop: 'var(--sp-2)' }}
                >
                  Create a workspace
                </Link>
              </div>
            ) : (
              <>
                <div className="tree-root">
                  <span className="avatar" aria-hidden="true">
                    {orgInitials}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="name">
                      {currentOrg !== null ? currentOrg.name : tenant.name}
                    </div>
                    <div className="label">
                      {currentOrg !== null ? 'Organisation tenant' : 'Personal tenant'}
                    </div>
                  </div>
                  <span className="tree-count">
                    {graphs.length} workspace{graphs.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="tree-list">
                  {treeItems.map((g) => {
                    const state = statusState(g.status);
                    return (
                      <Link
                        key={g.id}
                        to={`/app/workspaces/${g.id}`}
                        className="tree-item"
                        data-state={state}
                      >
                        <span className="stem" aria-hidden="true" />
                        <span className="dot" aria-hidden="true" />
                        <span className="meta">
                          <span className="name">{g.name}</span>
                          <span className="stats">
                            <span className="num">{nf.format(g.nodeCount)} nodes</span>
                            <span className="sep" aria-hidden="true" />
                            <span className="num">{nf.format(g.relationshipCount)} edges</span>
                            <span className="sep" aria-hidden="true" />
                            <span>updated {relTime(g.updatedAt)}</span>
                          </span>
                        </span>
                        <span className="status">
                          <span
                            className={state === 'active' ? 'dot-s is-pulse' : 'dot-s'}
                            aria-hidden="true"
                          />{' '}
                          {g.status}
                        </span>
                        <IconChevRight size={14} className="chev" />
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live activity — the run/ingest event stream lands with the Wave-1 jobs surface. */}
        <div className="card">
          <div className="card-head">
            <div className="h">
              <h2>Live activity</h2>
              <span className="sub">Agent runs and ingestion events</span>
            </div>
          </div>
          <div className="card-body no-pad">
            <div className="empty">
              <span className="empty-icon">
                <IconActivity size={24} />
              </span>
              <span className="t">No activity yet</span>
              <span className="s">
                Agent runs, ingestion jobs, and member events will stream here once agents are
                running.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Row 2 — quick actions + graph preview */}
      <section className="dash-row-2">
        <div className="card">
          <div className="card-head">
            <div className="h">
              <h2>Quick actions</h2>
              <span className="sub">Common starts for this tenant</span>
            </div>
          </div>
          <div className="card-body no-pad">
            <div className="qa-grid">
              {quickActions.map((a) => {
                const Ico = a.icon;
                return (
                  <Link key={a.title} to={a.to} className="qa">
                    <span className="qa-icon" aria-hidden="true">
                      <Ico size={13} />
                    </span>
                    <span className="title">{a.title}</span>
                    <span className="sub">{a.sub}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-head">
            <div className="h">
              <h2>
                {newest !== undefined ? `Knowledge graph · ${newest.name}` : 'Knowledge graph'}
              </h2>
              <span className="sub">
                {newest !== undefined
                  ? `${nf.format(newest.nodeCount)} nodes · ${nf.format(newest.relationshipCount)} edges`
                  : 'Your most recent workspace appears here'}
              </span>
            </div>
            {newest !== undefined && (
              <Link
                to={`/app/workspaces/${newest.id}/explorer`}
                className="btn"
                data-variant="ghost"
                data-size="sm"
              >
                Open explorer <IconArrowUpRight size={14} />
              </Link>
            )}
          </div>
          <div className="card-body no-pad" style={{ flex: 1, display: 'flex' }}>
            {newest !== undefined ? (
              <div className="graph-preview surface-dark">
                <GraphPreviewArt graph={newest} />
                <Link to={`/app/workspaces/${newest.id}/explorer`} className="pv-cta">
                  <IconArrowUpRight size={11} /> Open Explorer
                </Link>
                <div className="pv-meta">
                  {statusState(newest.status) === 'active' ? (
                    <span className="live">
                      <span className="live-dot is-pulse" aria-hidden="true" /> {newest.status}
                    </span>
                  ) : (
                    <span>{newest.status}</span>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>updated {relTime(newest.updatedAt)}</span>
                </div>
              </div>
            ) : (
              <div className="empty" style={{ flex: 1 }}>
                <span className="empty-icon">
                  <IconDatabase size={24} />
                </span>
                <span className="t">Nothing to preview</span>
                <span className="s">Create a workspace and ingest a source to see it here.</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
