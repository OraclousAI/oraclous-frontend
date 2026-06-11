// The Oraclous symbol used ALONE — matches /brand/avatar-live.png (dark square · paper ">" chevron ·
// mint "I" cursor), but the cursor BLINKS (the live signal). Use this wherever the mark stands without
// the wordmark. The chevron is the brand chevron path (paper on the dark square — never green); only
// the cursor carries the mint.
const CHEV = 'M 0,0 L 56,23 Q 62,25 62,30 L 62,36 Q 62,41 56,43 L 0,66 L 0,52 L 47,34 Q 48,33 47,32 L 0,13 Z';

export function OraclousAvatar({ size = 32, label = 'Oraclous' }: { size?: number; label?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.13,
        width: size,
        height: size,
        borderRadius: size * 0.2,
        background: 'var(--ink)',
        flex: 'none',
      }}
    >
      <svg viewBox="0 0 62 67" aria-hidden="true" style={{ height: size * 0.42, color: 'var(--paper)' }}>
        <path d={CHEV} fill="currentColor" />
      </svg>
      <span
        className="is-blink"
        aria-hidden="true"
        style={{ display: 'inline-block', width: Math.max(2, size * 0.1), height: size * 0.44, background: 'var(--accent)', borderRadius: 1 }}
      />
    </span>
  );
}
