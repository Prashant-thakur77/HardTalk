import { describe, expect, it } from 'vitest';

import { colors, scoreColors } from '../theme';

/** WCAG 2.2 relative luminance and contrast ratio. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r!) + 0.7152 * linear(g!) + 0.0722 * linear(b!);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

// Every text colour on every background it is actually drawn on.
const textPairs: [string, string, string][] = [
  ['body text on page', colors.text, colors.background],
  ['body text on card', colors.text, colors.surface],
  ['muted text on page', colors.textMuted, colors.background],
  ['muted text on card', colors.textMuted, colors.surface],
  ['muted speaker label on persona bubble', colors.textMuted, colors.personaBubble],
  ['text on persona bubble', colors.text, colors.personaBubble],
  ['text on your bubble', colors.onPrimary, colors.userBubble],
  ['button label', colors.onPrimary, colors.primary],
  ['link and status', colors.primary, colors.background],
  ['quote text', colors.text, colors.quote],
  ['selected choice label', colors.primary, colors.quote],
  ['mock banner', colors.onNotice, colors.notice],
  ['success text', colors.success, colors.surface],
  ['error text', colors.danger, colors.background],
  ['hero title', colors.onHero, colors.hero],
  ['hero body', colors.onHeroMuted, colors.hero],
  ['"Best" chip', colors.success, '#E3F2EA'],
  ['"Try saying" callout', colors.text, '#EAF5EF'],
  ['stance label on card', colors.warning, colors.surface],
  ['"asks about" topic tag', colors.text, colors.track],
  ['score 3 skill number on page', colors.good, colors.background],
  ['"This time" label in What changed', colors.success, '#EAF5EF'],
  ['track tab label', colors.text, colors.surface],
  ['selected track tab label', colors.onPrimary, colors.primary],
  ['speaking name under a face', colors.primary, colors.surface],
  ...Object.entries(scoreColors).map(
    ([score, color]) => [`score ${score} on card`, color, colors.surface] as [string, string, string],
  ),
];

describe('colour contrast (WCAG 2.2)', () => {
  it.each(textPairs)('%s is at least 4.5:1 (1.4.3)', (_, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['unselected control border on page', colors.borderStrong, colors.background],
    ['unselected control border on card', colors.borderStrong, colors.surface],
    ['selected control border', colors.primary, colors.quote],
    ['track tab border', colors.borderStrong, colors.background],
  ])('%s is at least 3:1 (1.4.11)', (_, border, background) => {
    expect(contrast(border, background)).toBeGreaterThanOrEqual(3);
  });
});
