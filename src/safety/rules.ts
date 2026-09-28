import { z } from 'zod';

/** Shape of data/safety.yaml. Pure so the app and the server run the exact same checks. */
export const safetyConfigSchema = z.strictObject({
  disclaimer: z.string().min(1),
  stop_words: z.array(z.string().min(1)).min(1),
  distress_patterns: z.array(z.string().min(1)).min(1),
  idiom_exceptions: z.array(z.string().min(1)),
  resources: z.array(z.strictObject({ name: z.string(), detail: z.string(), url: z.url().optional() })).min(1),
});
export type SafetyConfig = z.infer<typeof safetyConfigSchema>;

const FILLER = new Set([
  'please', 'now', 'here', 'ok', 'okay', 'no', 'just', 'wait', 'sorry', 'actually', 'hey',
  'can', 'could', 'we', 'lets', 'i', 'want', 'need', 'to', 'the', 'id', 'like',
  'roleplay', 'role', 'play', 'practice', 'conversation', 'session',
]);

/**
 * "it"/"this" count only straight after "stop": "Stop it." ends the practice, while
 * "Can we pause it?" and "I need this to stop." are lines about the scenario.
 */
const OBJECTS_AFTER_STOP = new Set(['it', 'this']);

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
  return (
    tokens.some((word) => stops.has(word)) &&
    tokens.every(
      (word, i) =>
        stops.has(word) || FILLER.has(word) || (OBJECTS_AFTER_STOP.has(word) && tokens[i - 1] === 'stop'),
    )
  );
}

/**
 * Removes the known idioms first, then checks the distress patterns on what is left. An idiom
 * can only cancel its own exact phrase, never a disclosure elsewhere in the same line.
 */
export function detectDistress(
  text: string,
  config: Pick<SafetyConfig, 'distress_patterns' | 'idiom_exceptions'>,
): boolean {
  let remaining = text.toLowerCase().replace(/[’‘]/g, "'");
  for (const idiom of config.idiom_exceptions) remaining = remaining.replace(new RegExp(idiom, 'gi'), ' … ');
  return config.distress_patterns.some((pattern) => new RegExp(pattern, 'i').test(remaining));
}
