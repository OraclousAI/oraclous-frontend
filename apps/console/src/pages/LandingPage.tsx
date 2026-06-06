// Landing — the public first screen at `/`. A focused, on-brand hero: what Oraclous is + clear
// Sign in / Get started CTAs. Authenticated visitors are sent straight to the app.
import type { CSSProperties, ComponentType } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTokenStore } from '../lib/token-store.jsx';
import {
  Logo,
  Wordmark,
  IconLayers,
  IconSparkle,
  IconBot,
  IconPlug,
  type IconProps,
} from '../icons/index.js';

const VALUES: readonly {
  readonly icon: ComponentType<IconProps>;
  readonly title: string;
  readonly body: string;
}[] = [
  {
    icon: IconLayers,
    title: 'Ingest anything',
    body: 'Documents, data, and code become one connected knowledge graph.',
  },
  {
    icon: IconSparkle,
    title: 'Explore visually',
    body: 'Navigate everything you know as a living, rotating graph.',
  },
  {
    icon: IconBot,
    title: 'Agents that act',
    body: 'Capabilities that use real tools over your own data.',
  },
  {
    icon: IconPlug,
    title: 'Retrieve with context',
    body: 'Semantic, hybrid, and temporal retrieval, built in.',
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useTokenStore();
  if (isAuthenticated) return <Navigate to="/app" replace />;

  return (
    <div style={styles.page}>
      <header style={styles.nav}>
        <div style={styles.brand}>
          <Logo size={22} />
          <Wordmark height={18} />
        </div>
        <Link to="/login" style={styles.navLink}>
          Sign in
        </Link>
      </header>

      <main style={styles.hero}>
        <h1 style={styles.h1}>Your knowledge, as a living graph.</h1>
        <p style={styles.lede}>
          Oraclous turns everything you know — documents, data, and code — into a connected
          knowledge graph you can explore, retrieve, and put to work with agents.
        </p>
        <div style={styles.ctas}>
          <Link to="/signup" style={styles.primary}>
            Get started
          </Link>
          <Link to="/login" style={styles.secondary}>
            Sign in
          </Link>
        </div>

        <ul style={styles.values}>
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <li key={v.title} style={styles.value}>
                <span style={styles.valueIcon} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div>
                  <p style={styles.valueTitle}>{v.title}</p>
                  <p style={styles.valueBody}>{v.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      <footer style={styles.footer}>
        <span>© Oraclous</span>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background:
      'radial-gradient(1200px 600px at 50% -10%, var(--paper-soft, #eceae5), var(--paper, #f4f4f2))',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--ink, #0b1220)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    maxWidth: 1040,
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 9 },
  navLink: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--ink, #0b1220)',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--rule, #d7d6d2)',
  },
  hero: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 20,
    padding: '64px 24px 48px',
    maxWidth: 760,
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  h1: {
    margin: 0,
    fontSize: 'clamp(34px, 6vw, 56px)',
    lineHeight: 1.05,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: 'var(--ink, #0b1220)',
  },
  lede: {
    margin: 0,
    maxWidth: 600,
    fontSize: 'clamp(15px, 2.2vw, 18px)',
    lineHeight: 1.55,
    color: 'var(--mute, #65686f)',
  },
  ctas: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  primary: {
    padding: '12px 22px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--paper, #f4f4f2)',
    background: 'var(--ink, #0b1220)',
    borderRadius: 10,
    textDecoration: 'none',
  },
  secondary: {
    padding: '12px 22px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ink, #0b1220)',
    background: 'transparent',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 10,
    textDecoration: 'none',
  },
  values: {
    listStyle: 'none',
    margin: '36px 0 0',
    padding: 0,
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    width: '100%',
    textAlign: 'left',
  },
  value: {
    display: 'flex',
    gap: 12,
    padding: 16,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
  },
  valueIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 34,
    height: 34,
    flexShrink: 0,
    borderRadius: 9,
    background: 'var(--paper-soft, #eceae5)',
    color: 'var(--ink, #0b1220)',
  },
  valueTitle: { margin: 0, fontSize: 14.5, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  valueBody: { margin: '2px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--mute, #65686f)' },
  footer: {
    padding: '20px 24px',
    textAlign: 'center',
    fontSize: 12.5,
    color: 'var(--mute, #65686f)',
  },
} satisfies Record<string, CSSProperties>;
