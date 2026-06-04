import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--paper)',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--mute)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          404
        </p>
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            color: 'var(--ink)',
          }}
        >
          Page not found
        </h1>
        <p style={{ margin: '0 0 24px', color: 'var(--mute)', fontSize: 14 }}>
          The page you requested doesn&apos;t exist.
        </p>
        <button
          type="button"
          onClick={() => navigate('/app')}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Go to dashboard
        </button>
      </div>
    </main>
  );
}
