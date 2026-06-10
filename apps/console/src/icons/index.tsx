import type { CSSProperties, ReactNode } from 'react';
import oraclousSymbol from '../assets/oraclous-symbol.png';
import oraclousWordmark from '../assets/oraclous-wordmark.png';

export interface IconProps {
  size?: number;
  sw?: number;
  className?: string;
  style?: CSSProperties;
}

const Icon = ({
  size = 16,
  sw = 1.5,
  className,
  style,
  children,
}: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const IconHome = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h14V10" />
  </Icon>
);
export const IconLayers = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path d="m3 13 9 5 9-5" />
    <path d="m3 18 9 5 9-5" />
  </Icon>
);
export const IconBot = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="7" width="16" height="13" rx="3" />
    <path d="M12 3v4" />
    <circle cx="9" cy="13" r="1" />
    <circle cx="15" cy="13" r="1" />
    <path d="M9 17h6" />
  </Icon>
);
export const IconPlug = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 2v6" />
    <path d="M15 2v6" />
    <path d="M5 8h14v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V8Z" />
    <path d="M12 16v6" />
  </Icon>
);
export const IconUsers = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M15 20a4 4 0 0 1 7 0" />
  </Icon>
);
export const IconCard = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <path d="M7 15h4" />
  </Icon>
);
export const IconCog = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </Icon>
);
export const IconSparkle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 13.6 8.4 19 10 13.6 11.6 12 17l-1.6-5.4L5 10l5.4-1.6Z" />
    <path d="M19 17v3" />
    <path d="M17.5 18.5h3" />
  </Icon>
);
export const IconBell = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 8H4c0-2 2-3 2-8Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Icon>
);
export const IconChevUpDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="m7 9 5-5 5 5" />
    <path d="m7 15 5 5 5-5" />
  </Icon>
);
export const IconChevRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);
export const IconPlus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Icon>
);
export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 13l4 4L19 7" />
  </Icon>
);
export const IconSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);
export const IconActivity = (p: IconProps) => (
  <Icon {...p}>
    <path d="M22 12h-4l-3 8-6-16-3 8H2" />
  </Icon>
);
export const IconArrowUpRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </Icon>
);
export const IconList = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
  </Icon>
);
export const IconDatabase = (p: IconProps) => (
  <Icon {...p}>
    <ellipse cx="12" cy="5.5" rx="8" ry="3" />
    <path d="M4 5.5v13c0 1.66 3.58 3 8 3s8-1.34 8-3v-13" />
    <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
  </Icon>
);

// The Oraclous brand symbol (the ">|" mark). `size` is the height; width follows the aspect ratio.
// Decorative — it always sits beside the Wordmark or a button label, so it's hidden from AT.
export const Logo = ({ size = 22 }: { size?: number }) => (
  <img
    src={oraclousSymbol}
    alt=""
    aria-hidden="true"
    style={{ height: size, width: 'auto', display: 'block' }}
  />
);

// The Oraclous wordmark image — carries the brand name. `height` sizes it; width follows the aspect.
export const Wordmark = ({ height = 16 }: { height?: number }) => (
  <img src={oraclousWordmark} alt="Oraclous" style={{ height, width: 'auto', display: 'block' }} />
);
