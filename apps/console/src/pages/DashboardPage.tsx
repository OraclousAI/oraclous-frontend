// Dashboard — the /app landing. An at-a-glance overview composed from the session/org/graph data
// the app already has: a greeting, workspace/org counts, quick actions, and recent workspaces.
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useDash } from '../context/dash.js';
import { useGraphs } from '../lib/graphs.js';
import { SkeletonList } from '../components/ui/Skeleton.js';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

const styles = {
  page: { display: 'grid', gap: 24, maxWidth: 920 },
  header: { display: 'grid', gap: 4 },
  h1: { margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  sub: { margin: 0, fontSize: 13.5, color: 'var(--ink, #0b1220)' },
  stats: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  stat: {
    display: 'grid',
    gap: 2,
    padding: 16,
    minWidth: 140,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
  },
  statNum: { fontSize: 28, fontWeight: 700, color: 'var(--ink, #0b1220)' },
  statLabel: { fontSize: 13, color: 'var(--ink, #0b1220)' },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  primary: {
    padding: '9px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--paper, #f4f4f2)',
    background: 'var(--ink, #0b1220)',
    border: 'none',
    borderRadius: 8,
    textDecoration: 'none',
  },
  ghost: {
    padding: '9px 16px',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--ink, #0b1220)',
    background: 'transparent',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    textDecoration: 'none',
  },
  section: { display: 'grid', gap: 10 },
  h2: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  muted: { margin: 0, fontSize: 13.5, color: 'var(--ink, #0b1220)' },
  grid: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  },
  card: {
    display: 'grid',
    gap: 6,
    padding: 16,
    minWidth: 0,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 10,
    textDecoration: 'none',
    color: 'inherit',
  },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ink, #0b1220)',
    overflowWrap: 'break-word',
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--ink, #0b1220)',
    background: 'var(--paper-soft, #eceae5)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 999,
    padding: '2px 8px',
    whiteSpace: 'nowrap',
  },
  cardMeta: {
    margin: 0,
    fontSize: 12,
    color: 'var(--ink, #0b1220)',
    fontFamily: 'var(--font-mono, monospace)',
  },
  empty: {
    display: 'grid',
    gap: 10,
    padding: 24,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
    justifyItems: 'start',
  },
} satisfies Record<string, CSSProperties>;

export default function DashboardPage() {
  const { user, orgs, currentOrg } = useDash();
  const { graphs, isLoading } = useGraphs();

  const recent = [...graphs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Welcome back, {user.name}</h1>
        <p style={styles.sub}>{currentOrg !== null ? currentOrg.name : 'Your workspace'}</p>
      </header>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statNum}>{graphs.length}</span>
          <span style={styles.statLabel}>Workspaces</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statNum}>{orgs.length}</span>
          <span style={styles.statLabel}>Organisations</span>
        </div>
      </div>

      <div style={styles.actions}>
        <Link to="/app/workspaces" style={styles.primary}>
          New workspace
        </Link>
        <Link to="/app/tools" style={styles.ghost}>
          Browse tools
        </Link>
      </div>

      <section style={styles.section} aria-label="Recent workspaces">
        <h2 style={styles.h2}>Recent workspaces</h2>
        {isLoading ? (
          <SkeletonList rows={3} />
        ) : recent.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.muted}>
              No workspaces yet — create your first to start building a knowledge graph.
            </p>
            <Link to="/app/workspaces" style={styles.primary}>
              Create a workspace
            </Link>
          </div>
        ) : (
          <ul style={styles.grid}>
            {recent.map((g) => (
              <li key={g.id}>
                <Link to={`/app/workspaces/${g.id}`} style={styles.card}>
                  <div style={styles.cardTop}>
                    <span style={styles.cardName}>{g.name}</span>
                    <span style={styles.badge} aria-label={`status: ${g.status}`}>
                      {g.status}
                    </span>
                  </div>
                  <p style={styles.cardMeta}>
                    {g.nodeCount} nodes
                    {formatDate(g.updatedAt) !== '' ? ` · updated ${formatDate(g.updatedAt)}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
