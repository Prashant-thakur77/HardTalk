import { z } from 'zod';

/** Shape of data/safety.yaml. Pure so the app and the server run the exact same checks. */
export const safetyConfigSchema = z.strictObject({
  disclaimer: z.string().min(1),
  stop_words: z.array(z.string().min(1)).min(1),
  stop_filler: z.array(z.string().min(1)),
  stop_objects: z.array(z.string().min(1)),
  pause_lead_ins: z.array(z.string().min(1)),
  pause_trailers: z.array(z.string().min(1)),
  distress_explicit: z.array(z.string().min(1)).min(1),
  distress_ambiguous: z.array(z.string().min(1)),
  line_idioms: z.array(z.string().includes(' ')),
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

/** The whole line as plain words: what a line idiom must equal exactly. */
function plainLine(text: string): string {
  return normalise(text)
    .replace(/[^a-z' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(clause: string, names: Set<string>): string[] {
  return clause
    .replace(/[^a-z' ]+/g, ' ')
    .split(' ')
    .map((word) => word.replace(/'/g, ''))
    .filter((word) => word && !names.has(word));
}

type StopConfig = Pick<SafetyConfig, 'stop_words' | 'stop_filler' | 'stop_objects' | 'pause_lead_ins' | 'pause_trailers'>;

/** Only stop words and filler; "it/this/that" only straight after "stop". */
function isStopClause(tokens: string[], config: StopConfig): boolean {
  const stops = new Set(config.stop_words);
  const filler = new Set(config.stop_filler);
  const objects = new Set(config.stop_objects);
  if (tokens.length === 0 || tokens.length > 12) return false;
  return (
    tokens.some((word) => stops.has(word)) &&
    tokens.every((word, i) => stops.has(word) || filler.has(word) || (objects.has(word) && tokens[i - 1] === 'stop'))
  );
}

/**
 * A clause that is only a request to stop ends the practice, whatever else the line says:
 * "Stop, you're scaring me." A clause that only says "pause" counts only when everything around
 * it is a lead-in or a short trailer, because "Can we pause, and look at the sprint?" is
 * pushback. "Can I stop you there?" is roleplay: "you" is never filler.
 */
export function isStopRequest(text: string, config: StopConfig, personaNames: string[] = []): boolean {
  const names = new Set(personaNames.flatMap((name) => name.toLowerCase().split(/\s+/)));
  const leadIns = new Set(config.pause_lead_ins);
  const trailers = config.pause_trailers.map((trailer) => new RegExp(`^(?:${trailer})$`));

  return sentences(text).some((sentence) => {
    const clauses = sentence.split(/\s*,\s*/);
    const tokens = clauses.map((clause) => words(clause, names));
    if (tokens.some((clause) => clause.includes('stop') && isStopClause(clause, config))) return true;

    const pauseAt = tokens.findIndex((clause) => isStopClause(clause, config));
    if (pauseAt === -1) return false;
    const leadInsOk = tokens.slice(0, pauseAt).every((clause) => clause.every((word) => leadIns.has(word)));
    const trailersOk = clauses
      .slice(pauseAt + 1)
      .every(
        (clause, i) =>
          isStopClause(tokens[pauseAt + 1 + i]!, config) ||
          tokens[pauseAt + 1 + i]!.length === 0 ||
          trailers.some((trailer) => trailer.test(clause.replace(/[^a-z' ]+/g, ' ').trim())),
      );
    return leadInsOk && trailersOk;
  });
}

/**
 * Tier 1 patterns are always distress. A tier 2 word is distress unless the whole line is
 * exactly one of the line idioms, so no idiom can cover anything but itself.
 */
export function detectDistress(
  text: string,
  config: Pick<SafetyConfig, 'distress_explicit' | 'distress_ambiguous' | 'line_idioms'>,
): boolean {
  const explicit = config.distress_explicit.map((pattern) => new RegExp(pattern));
  if (sentences(text).some((sentence) => explicit.some((pattern) => pattern.test(sentence)))) return true;

  const line = plainLine(text);
  if (!config.distress_ambiguous.some((pattern) => new RegExp(pattern).test(line))) return false;
  return !config.line_idioms.some((idiom) => new RegExp(`^(?:${idiom})$`).test(line));
}
