// Minimal inline-SVG icon set — dependency-free (no lucide-react, which isn't installed and
// would cost bundle budget for ~6 glyphs). Strokes use currentColor so the caller's token
// colour flows through. 16px default, decorative by default (aria-hidden).

export type IconName =
  | 'check-circle'
  | 'git-branch'
  | 'help-circle'
  | 'hash'
  | 'x'
  | 'external'
  | 'alert';

const PATHS: Record<IconName, string> = {
  // DIRECT
  'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  // INFERRED (a branch — derived)
  'git-branch': 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 9a9 9 0 0 1-9 9',
  // ASSUMPTION
  'help-circle': 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  // section anchor
  hash: 'M4 9h16M4 15h16M10 3 8 21M16 3l-2 18',
  // close
  x: 'M18 6 6 18M6 6l12 12',
  // external link
  external: 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  // conflict / disputed
  alert: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01',
};

export function Icon({
  name,
  size = 16,
  label,
}: {
  name: IconName;
  size?: number;
  /** When provided, the icon is meaningful: exposes an accessible label. */
  label?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={{ flex: 'none' }}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
