'use client';
// Sticky orientation band, reused as the top of both surfaces. Active link via next/navigation.
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const linkBase: React.CSSProperties = {
  textDecoration: 'none',
  paddingBottom: '2px',
  borderBottom: '2px solid transparent',
};

function navStyle(active: boolean): React.CSSProperties {
  return {
    ...linkBase,
    color: active ? 'var(--fg)' : 'var(--fg-mute)',
    borderBottomColor: active ? 'var(--fg)' : 'transparent',
    fontWeight: active ? 600 : 500,
  };
}

export function BrandHeader() {
  // Next strips basePath, so pathname is '/' or '/chat'.
  const pathname = usePathname();
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border-hair)',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--sp-6)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span className="t-eyebrow" style={{ color: 'var(--fg-mute)' }}>
            EURAIL × ORACLOUS
          </span>
          <span className="t-mono" style={{ fontWeight: 600, letterSpacing: '0.04em' }}>
            AI Adoption Analysis
          </span>
        </div>
        <nav aria-label="Primary" style={{ display: 'flex', gap: 'var(--sp-5)' }} className="t-dense">
          <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} style={navStyle(pathname === '/')}>
            Dashboard
          </Link>
          <Link
            href="/chat"
            aria-current={pathname === '/chat' ? 'page' : undefined}
            style={navStyle(pathname === '/chat')}
          >
            Onboarder
          </Link>
        </nav>
      </div>
    </header>
  );
}
