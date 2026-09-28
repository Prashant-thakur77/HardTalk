import { z } from 'zod';

/** Shape of data/safety.yaml. Pure so the app and the server run the exact same checks. */
export const safetyConfigSchema = z.strictObject({
  disclaimer: z.string().min(1),
  stop_words: z.array(z.string().min(1)).min(1),
  distress_explicit: z.array(z.string().min(1)).min(1),
  distress_ambiguous: z.array(z.string().min(1)),
  idiom_start: z.string(),
  idioms: z.array(z.string().includes(' ')),
  resources: z.array(z.strictObject({ name: z.string(), detail: z.string(), url: z.url().optional() })).min(1),
});
export type SafetyConfig = z.infer<typeof safetyConfigSchema>;

/** Lowercase, straight quotes, one space, and the spellings people actually type. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘ʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\bmy self\b/g, 'myself')
    .replace(/\bwanna\b/g, 'want to')
    .replace(/\bgonna\b/g, 'going to')
    .replace(/\bcannot\b/g, "can't")
    .replace(/\bdo not\b/g, "don't")
    .replace(/\bi am\b/g, "i'm")
    .replace(/\bi have\b/g, "i've")
    .replace(/\bi would\b/g, "i'd")
    .trim();
}

function sentences(text: string): string[] {
  return normalise(text)
    .split(/[.!?;]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

const FILLER = new Set([
  'please', 'pls', 'plz', 'now', 'here', 'ok', 'okay', 'no', 'just', 'wait', 'sorry', 'actually',
  'hey', 'can', 'could', 'we', 'lets', 'i', 'want', 'need', 'to', 'the', 'id', 'like', 'for', 'a',
  'bit', 'moment', 'second', 'minute', 'there', 'thanks', 'thank', 'you', 'roleplay', 'role', 'play',
  'practice', 'conversation', 'session',
]);

/**
 * "it", "this" and "that" count only straight after "stop": "Stop it." ends the practice, while
 * "Can we pause it?" and "I need this to stop." are lines about the scenario.
 */
const OBJECTS_AFTER_STOP = new Set(['it', 'this', 'that']);

function isStopSentence(sentence: string, stops: Set<string>, names: Set<string>): boolean {
  let tokens = sentence
    .replace(/\bi mean it\b/g, '')
    .replace(/[^a-z' ]+/g, ' ')
    .split(' ')
    .map((word) => word.replace(/'/g, ''))
    .filter(Boolean);
  // Addressing the persona by name: "Sam, stop." / "Stop it, Sam." / "Alex stop".
  tokens = tokens.filter((word, i) => !(names.has(word) && (i === 0 || i === tokens.length - 1)));
  if (tokens.length === 0 || tokens.length > 12) return false;
  return (
    tokens.some((word) => stops.has(word)) &&
    tokens.every(
      (word, i) =>
        stops.has(word) || FILLER.has(word) || (OBJECTS_AFTER_STOP.has(word) && tokens[i - 1] === 'stop'),
    )
  );
}

/** True when any sentence is only a request to stop ("Stop.", "Sam, can we pause here please?"). */
export function isStopRequest(
  text: string,
  config: Pick<SafetyConfig, 'stop_words'>,
  personaNames: string[] = [],
): boolean {
  const stops = new Set(config.stop_words);
  const names = new Set(personaNames.map((name) => name.toLowerCase()));
  // Split before normalising commas away, so "Sam, stop." keeps its vocative.
  return sentences(text).some((sentence) =>
    sentence.split(/,\s*/).length <= 3
      ? isStopSentence(sentence.replace(/,/g, ' '), stops, names)
      : false,
  );
}

function spans(pattern: RegExp, text: string): [number, number][] {
  return [...text.matchAll(new RegExp(pattern.source, 'g'))].map((match) => [
    match.index,
    match.index + match[0].length,
  ]);
}

/**
 * Tier 1 patterns are always distress. A tier 2 occurrence is distress unless an idiom match
 * covers it exactly where it occurs, so an idiom never cancels anything outside its own words.
 */
export function detectDistress(
  text: string,
  config: Pick<SafetyConfig, 'distress_explicit' | 'distress_ambiguous' | 'idiom_start' | 'idioms'>,
): boolean {
  const explicit = config.distress_explicit.map((pattern) => new RegExp(pattern));
  const ambiguous = config.distress_ambiguous.map((pattern) => new RegExp(pattern));
  const idioms = config.idioms.map((idiom) => new RegExp(idiom.replace('{{start}}', config.idiom_start)));

  return sentences(text).some((sentence) => {
    if (explicit.some((pattern) => pattern.test(sentence))) return true;
    const covered = idioms.flatMap((idiom) => spans(idiom, sentence));
    return ambiguous.some((pattern) =>
      spans(pattern, sentence).some(
        ([start, end]) => !covered.some(([from, to]) => from <= start && to >= end),
      ),
    );
  });
}
