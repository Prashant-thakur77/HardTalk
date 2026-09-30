import draftsData from '@data/mock/drafts.yaml';
import { z } from 'zod';

import { config } from '@/config';
import { isDistressLine, NotScoredForSafety } from '@/safety';
import { getTrack } from '@/tracks';
import { trackIdSchema, type TrackId } from '@/tracks/schema';

import { draftSchema, scenarioFromDraft } from './draft';
import { peopleIn } from './people';
import { scenarioSchema, type Scenario } from './schema';

const samplesSchema = z.object({
  samples: z.array(z.object({ track: trackIdSchema, label: z.string().min(1), source: z.string().min(1), draft: draftSchema })),
});

/** One sample text per track, with the draft a live drafter returns for it (data/mock/drafts.yaml). */
export const draftSamples = samplesSchema.parse(draftsData).samples;

export function sampleFor(track: TrackId) {
  const sample = draftSamples.find((candidate) => candidate.track === track);
  if (!sample) throw new Error(`No sample draft for track "${track}"`);
  return sample;
}

/** The sample panel for a track, as the people in it and what each will ask about. */
export function samplePanel(track: TrackId) {
  const sample = sampleFor(track);
  return { label: sample.label, people: peopleIn(scenarioFromDraft(sample.draft, track, 0, sampleScenarioId(track)), 'L1') };
}

/** One line for a paywall that cannot draw faces: "From a debate society motion: Elena asks about…". */
export function sampleLine(track: TrackId): string {
  const { label, people } = samplePanel(track);
  const asks = people.map((person) => `${person.name} asks about ${lowerFirst(person.asksAbout[0] ?? 'your answers')}`);
  return `For example, from ${lowerFirst(label)}: ${asks.join('; ')}.`;
}

/** "Covering settlement in November" → "covering settlement in November": names keep their capitals. */
export const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** Mock mode's drafted sample keeps one id per track, so its recorded replay can be found. */
export const sampleScenarioId = (track: TrackId) => `custom-sample-${track}`;

/**
 * Live: the server drafts a scenario from the pasted text with Claude. Mock: the recorded draft
 * for this track's sample, whatever was pasted, so the screen says so.
 */
export async function draftScenario(track: TrackId, source: string, aboutTopic = false): Promise<Scenario> {
  // The same check as every spoken line. Pasted text that sounds like distress is held until the
  // user says it is a topic in the posting or pitch, not about them; nothing weakens the check.
  const topic = aboutTopic && !getTrack(track).paste_is_own_words;
  if (!topic && isDistressLine(source)) throw new NotScoredForSafety();
  if (config.mock) {
    const sample = scenarioFromDraft(sampleFor(track).draft, track, Date.now(), sampleScenarioId(track));
    return { ...sample, sensitive_topic: topic };
  }

  const response = await fetch(`${config.serverUrl}/scenario/draft`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ track, source, aboutTopic: topic }),
  });
  const body = (await response.json()) as { scenario?: unknown; error?: string; safety?: boolean };
  if (body.safety) throw new NotScoredForSafety();
  if (!response.ok) throw new Error(body.error ?? `Drafting failed (${response.status}).`);
  return scenarioSchema.parse({ ...(body.scenario as object), sensitive_topic: topic });
}
