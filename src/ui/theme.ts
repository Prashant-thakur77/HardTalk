/** Every text/background pair used here meets WCAG AA (4.5:1). */
export const colors = {
  background: '#F7F6F2',
  surface: '#FFFFFF',
  text: '#16161A',
  textMuted: '#55555F',
  /** Decorative dividers only. Interactive boundaries use borderStrong (3:1, WCAG 1.4.11). */
  border: '#DAD8D0',
  borderStrong: '#8C8A80',
  primary: '#2445C8',
  onPrimary: '#FFFFFF',
  personaBubble: '#ECEAE3',
  userBubble: '#2445C8',
  quote: '#EEF1FB',
  success: '#12703F',
  /** A 3 out of 4: on the red → amber → lime → green ramp, and never the blue that means "tap me". */
  good: '#3F6212',
  warning: '#8A4B00',
  danger: '#B42318',
  notice: '#FFF4D6',
  onNotice: '#5C4300',
  /** Hero band on the home screen; white text on it is 11:1. */
  hero: '#1B2B7A',
  onHero: '#FFFFFF',
  onHeroMuted: '#C9D2F6',
  track: '#E6E4DC',
} as const;

/** Soft card elevation, identical on iOS, Android and web. */
export const shadow = {
  shadowColor: '#1B1B2F',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

export const scoreColors: Record<number, string> = {
  1: colors.danger,
  2: colors.warning,
  3: colors.good,
  4: colors.success,
};

/**
 * Lighter fills for the same ramp, for the score ring and skill bars: graphics need 3:1, not
 * text's 4.5:1, and the brighter steps read as one clear red → amber → lime → green scale.
 */
export const scoreStrokes: Record<number, string> = {
  1: '#DC2626',
  2: '#D97706',
  3: '#5B9A0B',
  4: '#166534',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = 12;

/** Minimum touch target, in points (WCAG 2.5.5 / Apple HIG). */
export const MIN_TARGET = 48;

export const type = {
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  heading: { fontSize: 20, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  caption: { fontSize: 14, lineHeight: 19, color: colors.textMuted },
} as const;
