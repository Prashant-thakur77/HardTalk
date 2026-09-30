import draftsData from '@data/mock/drafts.yaml';
import { z } from 'zod';

import { config } from '@/config';
import { trackIdSchema, type TrackId } from '@/tracks/schema';

import { draftSchema, scenarioFromDraft } from './draft';
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

/** Mock mode's drafted sample keeps one id per track, so its recorded replay can be found. */
export const sampleScenarioId = (track: TrackId) => `custom-sample-${track}`;

/**
 * Live: the server drafts a scenario from the pasted text with Claude. Mock: the recorded draft
 * for this track's sample, whatever was pasted, so the screen says so.
 */
export async function draftScenario(track: TrackId, source: string): Promise<Scenario> {
  if (config.mock) return scenarioFromDraft(sampleFor(track).draft, track, Date.now(), sampleScenarioId(track));

  const response = await fetch(`${config.serverUrl}/scenario/draft`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ track, source }),
  });
  const body = (await response.json()) as { scenario?: unknown; error?: string };
  if (!response.ok) throw new Error(body.error ?? `Drafting failed (${response.status}).`);
  return scenarioSchema.parse(body.scenario);
}
