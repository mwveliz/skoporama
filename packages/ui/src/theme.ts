// ─────────────────────────────────────────────
// @skoporama/ui — Design Theme & Tokens
// Shared design system for both web and mobile
// ─────────────────────────────────────────────

/** Color palette — dark mode optimized for low eye fatigue */
export const COLORS = {
  // Backgrounds
  bgPrimary: '#0a0a12',
  bgSecondary: '#12121e',
  bgTertiary: '#1a1a2e',
  bgElevated: '#22223a',

  // Key colors
  keyDefault: '#1e1e36',
  keyHover: '#2a2a4e',
  keyActive: '#3a3a6e',
  keyGazeHighlight: 'rgba(56, 189, 248, 0.3)',

  // Gaze indicator
  gazeCore: '#38bdf8',
  gazeOuter: 'rgba(56, 189, 248, 0.15)',
  gazeTrail: 'rgba(139, 92, 246, 0.2)',

  // Accent gradient
  accentPrimary: '#38bdf8',    // Cyan
  accentSecondary: '#8b5cf6',  // Purple
  accentTertiary: '#ec4899',   // Pink

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  textOnAccent: '#ffffff',

  // Functional
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Prediction bar
  predictionBg: 'rgba(30, 30, 54, 0.8)',
  predictionBorder: 'rgba(56, 189, 248, 0.2)',
  predictionActive: 'rgba(56, 189, 248, 0.15)',

  // Glass effect
  glassBg: 'rgba(18, 18, 30, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
} as const;

/** Spacing scale (in pixels) */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Typography */
export const TYPOGRAPHY = {
  fontFamily: "'Inter', 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  
  // Font sizes
  sizeXs: 12,
  sizeSm: 14,
  sizeMd: 16,
  sizeLg: 18,
  sizeXl: 22,
  sizeXxl: 28,
  sizeDisplay: 36,

  // Font weights
  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  weightBold: '700' as const,

  // Line heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,

  // Key label size (large for accessibility)
  keyLabel: 20,
  keyLabelLarge: 26,
  keyLabelSmall: 16,
} as const;

/** Border radius */
export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

/** Shadow definitions (for elevation) */
export const SHADOWS = {
  key: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  keyActive: {
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
