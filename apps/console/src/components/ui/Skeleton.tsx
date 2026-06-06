// Loading skeletons — console-native shimmer placeholders (inline styles + a tiny CSS pulse, no
// Tailwind). Skeleton is the primitive; SkeletonList renders a card list placeholder for the common
// "loading a list of rows" case. Decorative, so hidden from assistive tech (the container is the
// live region).
import type { CSSProperties } from 'react';
import './skeleton.css';

export function Skeleton({
  width = '100%',
  height = 14,
  radius = 6,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      className="oa-skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={styles.card}>
          <Skeleton width="38%" height={14} />
          <Skeleton width="68%" height={12} />
        </div>
      ))}
    </div>
  );
}

const styles = {
  list: { display: 'grid', gap: 10 },
  card: {
    display: 'grid',
    gap: 8,
    padding: '14px 16px',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 10,
    background: 'var(--paper, #f4f4f2)',
  },
} satisfies Record<string, CSSProperties>;
