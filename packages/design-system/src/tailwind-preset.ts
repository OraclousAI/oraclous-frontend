/**
 * Oraclous Design System — Tailwind CSS preset
 *
 * Usage in app tailwind.config.ts:
 *   import { tailwindPreset } from '@oraclous/design-system';
 *   export default { presets: [tailwindPreset], content: [...] } satisfies Config;
 *
 * The preset wires CSS custom properties (from tokens.css) to Tailwind utility
 * classes. Apps must also import tokens.css globally so the vars resolve.
 */

import { palette, fontFamily, radius, spacing } from './tokens.js';

type TailwindColor = string | Record<string, string>;

interface TailwindPreset {
  theme: {
    extend: {
      colors: Record<string, TailwindColor>;
      fontFamily: Record<string, string[]>;
      spacing: Record<string, string>;
      borderRadius: Record<string, string>;
      keyframes: Record<string, Record<string, Record<string, string>>>;
      animation: Record<string, string>;
      boxShadow: Record<string, string>;
    };
  };
}

export const tailwindPreset: TailwindPreset = {
  theme: {
    extend: {
      colors: {
        // Brand palette — reference CSS vars for runtime theming
        ink: 'var(--ink)',
        paper: 'var(--paper)',
        'paper-soft': 'var(--paper-soft)',
        rule: 'var(--rule)',
        mute: 'var(--mute)',
        accent: palette.accent, // hardcoded — accent never changes per theme
        'accent-ink': palette.accentInk,

        // ReBAC permission states
        perm: {
          granted: 'var(--perm-granted)',
          'granted-bg': 'var(--perm-granted-bg)',
          inherited: 'var(--perm-inherited)',
          'inherited-bg': 'var(--perm-inherited-bg)',
          denied: 'var(--perm-denied)',
          'denied-bg': 'var(--perm-denied-bg)',
          expired: 'var(--perm-expired)',
          'expired-bg': 'var(--perm-expired-bg)',
        },

        // Semantic
        success: 'var(--success)',
        'success-bg': 'var(--success-bg)',
        warning: 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        error: 'var(--error)',
        'error-bg': 'var(--error-bg)',
        info: 'var(--info)',
        'info-bg': 'var(--info-bg)',

        // Surface aliases
        bg: 'var(--bg)',
        'bg-soft': 'var(--bg-soft)',
        fg: 'var(--fg)',
        'fg-mute': 'var(--fg-mute)',

        // shadcn/ui compatible tokens
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        // ui-accent: neutral hover surface (NOT the brand mint)
        'ui-accent': {
          DEFAULT: 'hsl(var(--ui-accent))',
          foreground: 'hsl(var(--ui-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },

      fontFamily: {
        sans: fontFamily.sans as string[],
        mono: fontFamily.mono as string[],
        serif: fontFamily.serif as string[],
      },

      spacing: {
        'sp-1': spacing.sp1,
        'sp-2': spacing.sp2,
        'sp-3': spacing.sp3,
        'sp-4': spacing.sp4,
        'sp-5': spacing.sp5,
        'sp-6': spacing.sp6,
        'sp-8': spacing.sp8,
        'sp-10': spacing.sp10,
        'sp-12': spacing.sp12,
        'sp-16': spacing.sp16,
        'sp-20': spacing.sp20,
        'sp-24': spacing.sp24,
      },

      borderRadius: {
        none: radius.r0,
        'r-1': radius.r1,
        sm: radius.r2,
        DEFAULT: radius.r3,
        md: radius.r3,
        lg: radius.r4,
        pill: radius.pill,
      },

      boxShadow: {
        'shadow-1': 'var(--shadow-1)',
        'shadow-2': 'var(--shadow-2)',
        'shadow-3': 'var(--shadow-3)',
      },

      keyframes: {
        'oraclous-blink': {
          '0%, 49.99%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'oraclous-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.7' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
      },

      animation: {
        'oraclous-blink': 'oraclous-blink var(--motion-blink-dur, 1.06s) steps(1, end) infinite',
        'oraclous-pulse': 'oraclous-pulse var(--motion-pulse-dur, 1.4s) ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 150ms cubic-bezier(0.2, 0, 0.2, 1) both',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
};
