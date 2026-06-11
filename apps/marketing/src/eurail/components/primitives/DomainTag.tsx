// DomainTag — DEC-001. Four distinct AA-safe domain identities: tinted fill + --fg code text +
// a leading accent dot. Identity never rests on colour alone (the 3-letter code is always read).
import type { DomainCode } from '../../corpus/types.js';

const STYLE: Record<DomainCode, { bg: string; dot: string; full: string }> = {
  INT: { bg: 'var(--info-bg)', dot: 'var(--info)', full: 'Inside the company' },
  USR: { bg: 'var(--success-bg)', dot: 'var(--success)', full: 'The customer side' },
  FED: { bg: 'var(--perm-inherited-bg)', dot: 'var(--perm-inherited)', full: 'The cooperative' },
  MKT: { bg: 'var(--warning-bg)', dot: 'var(--warning)', full: 'The market' },
};

export function DomainTag({ code, showDot = true }: { code: DomainCode; showDot?: boolean }) {
  const s = STYLE[code];
  return (
    <span
      className="t-mono"
      title={s.full}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--sp-1)',
        padding: '2px var(--sp-2)',
        background: s.bg,
        color: 'var(--fg)',
        borderRadius: 'var(--r-pill)',
        fontSize: '11px',
        lineHeight: 1.4,
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {showDot && (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: s.dot,
            flex: 'none',
          }}
        />
      )}
      {code}
    </span>
  );
}
