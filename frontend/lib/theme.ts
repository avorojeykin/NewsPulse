// NewsPulse Theme System
// Modern, vibrant design tokens for news categories

export const theme = {
  // Color Palette
  colors: {
    // Background layers
    background: {
      primary: '#0a0e1a',      // Deep navy - main background
      secondary: '#141927',    // Lighter navy - cards
      tertiary: '#1e2638',     // Mid navy - hover states
      elevated: '#262d42',     // Elevated surfaces
    },

    // Category colors - vibrant and energetic
    crypto: {
      primary: '#f59e0b',      // Amber/Orange - Bitcoin vibes
      secondary: '#fb923c',    // Light orange
      accent: '#fbbf24',       // Gold accent
      gradient: 'from-orange-500 to-amber-600',
      glow: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.3)',
    },

    stocks: {
      primary: '#10b981',      // Emerald green - money/growth
      secondary: '#34d399',    // Light green
      accent: '#059669',       // Deep green
      gradient: 'from-emerald-500 to-green-600',
      glow: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.3)',
    },

    sports: {
      primary: '#3b82f6',      // Blue - energy/competition
      secondary: '#60a5fa',    // Light blue
      accent: '#2563eb',       // Deep blue
      gradient: 'from-blue-500 to-indigo-600',
      glow: 'rgba(59, 130, 246, 0.15)',
      border: 'rgba(59, 130, 246, 0.3)',
    },

    xMentions: {
      primary: '#8b5cf6',      // Purple - social/trending
      secondary: '#a78bfa',    // Light purple
      accent: '#7c3aed',       // Deep purple
      gradient: 'from-violet-500 to-purple-600',
      glow: 'rgba(139, 92, 246, 0.15)',
      border: 'rgba(139, 92, 246, 0.3)',
    },

    // Semantic colors
    text: {
      primary: '#f8fafc',      // Almost white
      secondary: '#cbd5e1',    // Light gray
      tertiary: '#64748b',     // Medium gray
      muted: '#475569',        // Dark gray
    },

    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },

  // Spacing
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  // Border radius
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows and effects
  effects: {
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
    glow: {
      crypto: '0 0 20px rgba(245, 158, 11, 0.3)',
      stocks: '0 0 20px rgba(16, 185, 129, 0.3)',
      sports: '0 0 20px rgba(59, 130, 246, 0.3)',
      xMentions: '0 0 20px rgba(139, 92, 246, 0.3)',
    },
  },

  // Animation
  animation: {
    transition: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

// Category configurations
export const categories = {
  crypto: {
    id: 'crypto',
    name: 'Crypto',
    emoji: '₿',
    title: 'Cryptocurrency',
    description: 'Breaking crypto news, market analysis, and blockchain innovations',
    tagline: 'Stay ahead of the crypto markets',
    stats: '12 premium sources',
    theme: theme.colors.crypto,
    comingSoon: false,
  },
  stocks: {
    id: 'stocks',
    name: 'Stocks',
    emoji: '📈',
    title: 'Stock Market',
    description: 'Real-time stock market updates, earnings reports, and trading insights',
    tagline: 'Never miss a market move',
    stats: '12 premium sources',
    theme: theme.colors.stocks,
    comingSoon: false,
  },
  sports: {
    id: 'sports',
    name: 'Sports',
    emoji: '🏆',
    title: 'Sports Betting',
    description: 'Latest odds, betting lines, injury reports, and game-changing plays',
    tagline: 'Get the edge on every bet',
    stats: '12 premium sources',
    theme: theme.colors.sports,
    comingSoon: false,
  },
  xMentions: {
    id: 'xMentions',
    name: 'X Mentions',
    emoji: '𝕏',
    title: 'X (Twitter) Mentions',
    description: 'Real-time tweets from industry leaders and influencers',
    tagline: 'Breaking news as it happens',
    stats: 'Coming in Phase 2',
    theme: theme.colors.xMentions,
    comingSoon: true,
  },
} as const;

export type CategoryId = keyof typeof categories;
