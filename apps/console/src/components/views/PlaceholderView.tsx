export function PlaceholderView({ title }: { title: string }) {
  return (
    <div>
      <div
        style={{
          marginBottom: 28,
        }}
      >
        <p
          style={{
            margin: '0 0 6px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--mute)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Coming soon
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: 'var(--ink)',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            color: 'var(--mute)',
            fontSize: 14,
            maxWidth: '60ch',
          }}
        >
          This view is being built and will be available in a future release.
        </p>
      </div>
      <div
        style={{
          border: '1px solid var(--rule)',
          borderRadius: 10,
          background: 'var(--paper)',
          padding: '40px 24px',
          textAlign: 'center',
          color: 'var(--mute)',
          fontSize: 13,
        }}
        aria-label={`${title} — coming soon`}
      >
        <p style={{ margin: 0 }}>
          <strong style={{ color: 'var(--ink)' }}>{title}</strong> is on the roadmap.
        </p>
      </div>
    </div>
  );
}
