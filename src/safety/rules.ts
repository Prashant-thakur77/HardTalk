import { z } from 'zod';

/** Shape of data/safety.yaml. Pure so the app and the server run the exact same checks. */
export const safetyConfigSchema = z.strictObject({
  disclaimer: z.string().min(1),
  stop_words: z.array(z.string().min(1)).min(1),
  distress_patterns: z.array(z.string().min(1)).min(1),
  resources: z.array(z.strictObject({ name: z.string(), detail: z.string(), url: z.url().optional() })).min(1),
});
export type SafetyConfig = z.infer<typeof safetyConfigSchema>;

const FILLER = new Set([
  'please', 'now', 'here', 'ok', 'okay', 'no', 'just', 'wait', 'sorry', 'actually', 'hey',
  // No "it" or "this": "Can we pause it?" is a line about the export, not about the practice.
  'can', 'could', 'we', 'lets', 'i', 'want', 'need', 'to', 'the', 'id', 'like',
  'roleplay', 'role', 'play', 'practice', 'conversation', 'session',
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z' ]+/g, ' ')
    .split(' ')
    .filter(Boolean);
}

/** True for a line that is only a request to stop ("stop", "can we pause here please"). */
export function isStopRequest(text: string, config: Pick<SafetyConfig, 'stop_words'>): boolean {
  const tokens = words(text).map((word) => word.replace(/'/g, ''));
  if (tokens.length === 0 || tokens.length > 7) return false;
  const stops = new Set(config.stop_words);
  return tokens.some((word) => stops.has(word)) && tokens.every((word) => stops.has(word) || FILLER.has(word));
}

export function detectDistress(text: string, config: Pick<SafetyConfig, 'distress_patterns'>): boolean {
  const normalised = text.toLowerCase().replace(/[’]/g, "'");
  return config.distress_patterns.some((pattern) => new RegExp(pattern, 'i').test(normalised));
}
