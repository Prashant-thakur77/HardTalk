import { z } from 'zod';

/** Shape of data/safety.yaml. Pure so the app and the server run the exact same checks. */
export const safetyConfigSchema = z.strictObject({
  disclaimer: z.string().min(1),
  stop_words: z.array(z.string().min(1)).min(1),
  distress_explicit: z.array(z.string().min(1)).min(1),
  distress_ambiguous: z.array(z.string().min(1)),
  clause_start: z.string(),
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
    .replace(/\b(don|can|won|isn|wasn)t\b/g, "$1't")
    .replace(/\bim\b/g, "i'm")
    .replace(/\bive\b/g, "i've")
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
  'please', 'pls', 'plz', 'now', 'here', 'there', 'ok', 'okay', 'no', 'just', 'wait', 'sorry',
  'actually', 'hey', 'can', 'could', 'we', 'lets', 'i', 'want', 'need', 'to', 'the', 'id', 'like',
  'for', 'a', 'bit', 'moment', 'second', 'minute', 'thanks', 'roleplay', 'role', 'play',
  'practice', 'conversation', 'session',
]);

/**
 * "it", "this" and "that" count only straight after "stop": "Stop it." ends the practice, while
 * "Can we pause it?" and "I need this to stop." are lines about the scenario. "you" is never
 * filler: "Can I stop you there?" interrupts the persona, it does not end the practice.
 */
const OBJECTS_AFTER_STOP = new Set(['it', 'this', 'that']);

function isStopClause(clause: string, stops: Set<string>, names: Set<string>): boolean {
  const tokens = clause
    .replace(/\bthank you\b|\bi mean it\b/g, ' ')
    .replace(/[^a-z' ]+/g, ' ')
    .split(' ')
    .map((word) => word.replace(/'/g, ''))
    .filter((word) => word && !names.has(word));
  if (tokens.length === 0 || tokens.length > 12) return false;
  return (
    tokens.some((word) => stops.has(word)) &&
    tokens.every(
      (word, i) =>
        stops.has(word) || FILLER.has(word) || (OBJECTS_AFTER_STOP.has(word) && tokens[i - 1] === 'stop'),
    )
  );
}

const LEAD_IN = new Set([
  'no', 'hold', 'on', 'hang', 'wait', 'enough', 'sorry', 'ok', 'okay', 'look', 'please', 'hey',
  'right', 'alright', 'stop', 'pause', 'just', 'actually',
]);
/** What may follow a stop in the same sentence without turning it into roleplay. */
const TRAILER = /^(please|thanks|thank you|i mean it|now|sorry|i can'?t (do this|take this|breathe|cope)|i feel (sick|awful|terrible|unwell|faint|dizzy)|this is too much|i need a (break|minute|moment|second))$/;

function clauseWords(clause: string, names: Set<string>): string[] {
  return clause
    .replace(/[^a-z' ]+/g, ' ')
    .split(' ')
    .map((word) => word.replace(/'/g, ''))
    .filter((word) => word && !names.has(word));
}

/**
 * True when a sentence is a request to stop: one clause that is only a stop request, with
 * nothing around it but lead-ins ("Hold on,", "No, no,"), the persona's name, or short
 * trailers ("…, I can't do this"). "Can we pause, and look at the sprint?" is pushback, not a stop.
 */
export function isStopRequest(
  text: string,
  config: Pick<SafetyConfig, 'stop_words'>,
  personaNames: string[] = [],
): boolean {
  const stops = new Set(config.stop_words);
  const names = new Set(personaNames.flatMap((name) => name.toLowerCase().split(/\s+/)));
  return sentences(text).some((sentence) => {
    const clauses = sentence.split(/\s*,\s*/);
    const stopAt = clauses.findIndex((clause) => isStopClause(clause, stops, names));
    if (stopAt === -1) return false;
    const leadInsOk = clauses
      .slice(0, stopAt)
      .every((clause) => clauseWords(clause, names).every((word) => LEAD_IN.has(word)));
    const trailersOk = clauses
      .slice(stopAt + 1)
      .every(
        (clause) =>
          isStopClause(clause, stops, names) ||
          clauseWords(clause, names).length === 0 ||
          TRAILER.test(clause.replace(/[^a-z' ]+/g, ' ').trim()),
      );
    return leadInsOk && trailersOk;
  });
}

function spans(pattern: RegExp, text: string): [number, number][] {
  return [...text.matchAll(new RegExp(pattern.source, 'g'))].map((match) => [
    match.index,
    match.index + match[0].length,
  ]);
}

/**
 * Tier 1 patterns are always distress. A tier 2 occurrence is distress unless one of the closed
 * idioms covers it exactly where it occurs, so an idiom never cancels anything outside its words.
 */
export function detectDistress(
  text: string,
  config: Pick<SafetyConfig, 'distress_explicit' | 'distress_ambiguous' | 'clause_start' | 'idioms'>,
): boolean {
  const explicit = config.distress_explicit.map((pattern) => new RegExp(pattern));
  const ambiguous = config.distress_ambiguous.map((pattern) => new RegExp(pattern));
  const idioms = config.idioms.map((idiom) => new RegExp(idiom.replace('{{clause}}', config.clause_start)));

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
