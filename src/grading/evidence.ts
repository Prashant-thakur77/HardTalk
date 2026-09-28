import { DIMENSIONS, type Dimension, type Grade } from './rubric.schema';
import type { Turn } from './transcript';

/**
 * A score above 1 must be backed by the user's own words. A quote counts only if it appears in
 * a single user turn as whole words, and is either at least three words long or a complete
 * sentence ("No." can be evidence; "no" inside "know" cannot). Comparison ignores only what
 * speech-to-text and model output legitimately vary on: case, curly vs straight quotes, and
 * whitespace. Paraphrases, persona lines and quotes stitched across turns are rejected.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripWrapping(quote: string): string {
  return normalise(quote).replace(/^["'\s]+|["'\s]+$/g, '');
}

const isWordChar = (char: string | undefined) => char !== undefined && /[a-z0-9']/.test(char);
const wordCount = (text: string) => text.split(' ').filter((word) => /[a-z0-9]/.test(word)).length;

function occursAsWholeWords(needle: string, haystack: string): boolean {
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) {
    const before = haystack[at - 1];
    const after = haystack[at + needle.length];
    const startsClean = !isWordChar(needle[0]) || !isWordChar(before);
    const endsClean = !isWordChar(needle.at(-1)) || !isWordChar(after);
    if (startsClean && endsClean) return true;
  }
  return false;
}

function isWholeSentence(needle: string, turn: string): boolean {
  const trimmed = needle.replace(/[.!?]+$/, '');
  return turn.split(/(?<=[.!?])\s+/).some((sentence) => sentence.replace(/[.!?]+$/, '') === trimmed);
}

export function isGrounded(quote: string, turns: Turn[]): boolean {
  const needle = stripWrapping(quote);
  if (!/[a-z0-9]/.test(needle)) return false;
  return turns.some((turn) => {
    if (turn.speaker !== 'user') return false;
    const text = normalise(turn.text);
    if (!occursAsWholeWords(needle, text)) return false;
    return wordCount(needle) >= 3 || isWholeSentence(needle, text);
  });
}

export interface Ungrounded {
  dimension: Dimension;
  /** The quotes that were not found. Empty when a score above 1 cited nothing. */
  quotes: string[];
}

export function findUngrounded(grade: Grade, turns: Turn[]): Ungrounded[] {
  return DIMENSIONS.flatMap((dimension) => {
    const { score, evidence_quotes } = grade.dimensions[dimension];
    if (score <= 1) return [];
    const bad = evidence_quotes.filter((quote) => !isGrounded(quote, turns));
    return bad.length > 0 || evidence_quotes.length === 0 ? [{ dimension, quotes: bad }] : [];
  });
}

const DOWNGRADE_RATIONALE =
  "The grader's evidence for a higher score could not be found in what you said, so this is scored 1.";

/** Strips invented quotes; a dimension left with no real evidence drops to 1. */
export function downgradeUngrounded(grade: Grade, turns: Turn[]): Grade {
  const dimensions = { ...grade.dimensions };
  for (const dimension of DIMENSIONS) {
    const current = dimensions[dimension];
    const kept = current.evidence_quotes.filter((quote) => isGrounded(quote, turns));
    if (kept.length === current.evidence_quotes.length && (current.score <= 1 || kept.length > 0)) continue;
    dimensions[dimension] =
      kept.length > 0 || current.score <= 1
        ? { ...current, evidence_quotes: kept }
        : { ...current, score: 1, evidence_quotes: [], rationale: DOWNGRADE_RATIONALE };
  }
  const askGrounded = grade.ask_text !== null && isGrounded(grade.ask_text, turns);
  return { ...grade, dimensions, ask_text: askGrounded ? grade.ask_text : null };
}
