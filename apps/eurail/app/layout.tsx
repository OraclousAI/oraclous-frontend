// Root layout — the shared shell (skip-link → sticky BrandHeader → centered report column →
// provenance footer). Server component; renders the client BrandHeader + page children.
import type { ReactNode } from 'react';
import '@fontsource/sora/400.css';
import '@fontsource/sora/500.css';
import '@fontsource/sora/600.css';
import '@fontsource/sora/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@oraclous/design-system/tokens.css';
import '@oraclous/design-system/semantic.css';
import '../src/styles.css';
import { BrandHeader } from '../src/components/shell/BrandHeader.js';
import { corpusStats } from '../src/corpus/index.js';

export const metadata = {
  title: 'Eurail × Oraclous — AI Adoption Analysis',
  description:
    'An evidence-backed analysis of Eurail’s AI adoption position. Every claim traces to its source.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to report
        </a>
        <BrandHeader />
        <main
          id="main"
          tabIndex={-1}
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            padding: 'var(--sp-10) var(--sp-6) var(--sp-16)',
            outline: 'none',
          }}
        >
          {children}
        </main>
        <footer style={{ borderTop: '1px solid var(--border-hair)' }}>
          <p
            className="t-caption"
            style={{
              maxWidth: 1120,
              margin: '0 auto',
              padding: 'var(--sp-5) var(--sp-6)',
              color: 'var(--fg-mute)',
            }}
          >
            {corpusStats.evidence} evidence records · {corpusStats.conflicts} conflicts logged &
            resolved · {corpusStats.findings} findings · {corpusStats.domains} domains. Every claim
            traces to its source.
          </p>
        </footer>
      </body>
    </html>
  );
}
