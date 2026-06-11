// ConfidenceBadge — DEC-001. Colour is an accent (left bar + glyph), never the load-bearing
// signal: text is always --fg (ink) on the tint, and the level is spelled out ("DIRECT · HIGH")
// so it is never colour- or weight-only. AA-safe by construction.
import type { ConfidenceLabel, ConfidenceLevel } from '../../corpus/types.js';
import { Icon, type IconName } from './Icon.js';

const STYLE: Record<ConfidenceLabel, { bg: string; accent: string; icon: IconName }> = {
  DIRECT: { bg: 'var(--success-bg)', accent: 'var(--success)', icon: 'check-circle' },
  INFERRED: { bg: 'var(--info-bg)', accent: 'var(--info)', icon: 'git-branch' },
  ASSUMPTION: { bg: 'var(--warning-bg)', accent: 'var(--warning)', icon: 'help-circle' },
};

const BAR_WIDTH: Record<ConfidenceLevel, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export function ConfidenceBadge({
  label,
  level,
}: {
  label: ConfidenceLabel;
  level?: ConfidenceLevel;
}) {
  const s = STYLE[label];
  const lvl = level ?? 'MEDIUM';
  const dim = lvl === 'LOW';
  return (
    <span
      className="t-mono"
      title={`Confidence: ${label.toLowerCase()}${level ? `, ${level.toLowerCase()}` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--sp-1)',
        padding: '2px var(--sp-2)',
        background: s.bg,
        color: 'var(--fg)',
        borderRadius: 'var(--r-2)',
        // Full hairline only for LOW (the dashed "weaker" treatment); the accent left-bar
        // carries the level weight (3/2/1px) for every label.
        border: dim ? '1px dashed var(--border-hair)' : '1px solid transparent',
        borderLeftWidth: `${BAR_WIDTH[lvl]}px`,
        borderLeftStyle: 'solid',
        borderLeftColor: s.accent,
        fontSize: '11px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: dim ? 'var(--fg-mute)' : s.accent, display: 'inline-flex' }}>
        <Icon name={s.icon} size={13} />
      </span>
      <span style={{ letterSpacing: '0.04em' }}>
        {label}
        {level ? ` · ${level}` : ''}
      </span>
    </span>
  );
}
