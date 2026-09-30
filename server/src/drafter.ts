import { prettifyError } from 'zod';

import { draftSchema, scenarioFromDraft } from '../../src/scenarios/draft';
import type { Scenario } from '../../src/scenarios/schema';
import type { Track } from '../../src/tracks/schema';
import { drafterConfig } from './data';
import { claudeJsonModel, type ClaudeModelOptions, type JsonModel } from './models';

export class DraftError extends Error {
  name = 'DraftError';
}


/**
 * Drafts a practice scenario from text the user pasted: a job posting, a pitch, a motion. The
 * result goes through the same scenario schema as the built-ins; one retry with the problem
 * named, then a DraftError.
 */
export function drafter(model: JsonModel) {
  return async (track: Track, source: string): Promise<Scenario> => {
    const system = drafterConfig.instructions
      .replace('{{practising}}', track.practising.trim())
      .replace('{{rubrics}}', track.rubrics.join(', '));
    const request = drafterConfig.request.replace('{{track}}', track.name).replace('{{source}}', source.trim());

    let feedback: string | null = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const reply = await model({
        system,
        user: feedback ? `${request}\n\n${feedback}` : request,
        // String lengths and name patterns are checked again by draftSchema and scenarioFromDraft.
        schema: draftSchema,
        maxTokens: 16000,
        effort: 'medium',
      });
      if (reply.refused) throw new DraftError('This text could not be turned into a practice.');

      let raw: unknown;
      try {
        raw = JSON.parse(reply.text);
      } catch {
        feedback = 'Your previous answer was not valid JSON. Return only the JSON object.';
        continue;
      }
      const draft = draftSchema.safeParse(raw);
      if (!draft.success) {
        feedback = `Your previous answer broke these rules:\n${prettifyError(draft.error)}`;
        continue;
      }
      const people = [draft.data.persona, ...draft.data.panel];
      const offTrack = people.flatMap((person) => person.cares_about).filter((id) => !track.rubrics.includes(id));
      if (offTrack.length > 0) {
        feedback = `cares_about may only use ${track.rubrics.join(', ')}; you used ${offTrack.join(', ')}.`;
        continue;
      }
      try {
        return scenarioFromDraft(draft.data, track.id);
      } catch (error) {
        feedback = `Your previous answer broke these rules:\n${error instanceof Error ? error.message : String(error)}`;
      }
    }
    throw new DraftError('The panel could not be drafted from this text. Try again, or write it yourself.');
  };
}

export const claudeDrafter = (options: ClaudeModelOptions) => drafter(claudeJsonModel(options));
