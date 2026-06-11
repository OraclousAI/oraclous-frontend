import Link from 'next/link';

export default function NotFound() {
  return (
    <section aria-label="Not found" style={{ display: 'grid', gap: 'var(--sp-3)' }}>
      <h1 className="t-h2" style={{ margin: 0 }}>
        Not found
      </h1>
      <p className="t-body">
        That page doesn’t exist.{' '}
        <Link href="/" style={{ color: 'var(--info)' }}>
          Back to the dashboard
        </Link>
        .
      </p>
    </section>
  );
}
