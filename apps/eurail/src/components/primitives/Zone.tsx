// Zone — DEC-001. A report section: <section aria-labelledby> with a deep-linkable anchor, an
// optional eyebrow kicker, and a correct heading level (never skipped). The hash self-link
// appears on hover/focus.
import { type ReactNode, useId } from 'react';
import { Icon } from './Icon.js';

export function Zone({
  id,
  title,
  kicker,
  level = 2,
  children,
  topRule = false,
}: {
  /** Stable anchor id for deep-linking; falls back to a generated id. */
  id?: string;
  title: string;
  kicker?: string;
  level?: 2 | 3;
  children: ReactNode;
  topRule?: boolean;
}) {
  const generated = useId();
  // The section owns `id` (the anchor target); the heading needs its OWN id for
  // aria-labelledby — never the same id on both (duplicate-id is invalid + breaks anchors).
  const headingId = id ? `${id}-h` : generated;
  const Heading = level === 3 ? 'h3' : 'h2';
  const headingClass = level === 3 ? 't-h3' : 't-h2';

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      style={{
        scrollMarginTop: 'calc(56px + var(--sp-4))',
        paddingTop: topRule ? 'var(--sp-10)' : undefined,
        borderTop: topRule ? '1px solid var(--border-hair)' : undefined,
      }}
    >
      <header style={{ marginBottom: 'var(--sp-5)' }}>
        {kicker && (
          <p
            className="t-eyebrow"
            style={{ color: 'var(--fg-mute)', margin: '0 0 var(--sp-1)' }}
          >
            {kicker}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)' }}>
          <Heading id={headingId} className={headingClass} style={{ margin: 0 }}>
            {title}
          </Heading>
          {id && (
            <a
              href={`#${id}`}
              aria-label={`Link to section: ${title}`}
              className="zone-anchor"
              style={{
                color: 'var(--fg-mute)',
                display: 'inline-flex',
                textDecoration: 'none',
              }}
            >
              <Icon name="hash" size={15} />
            </a>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
