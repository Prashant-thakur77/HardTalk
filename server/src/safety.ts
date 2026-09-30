import { z } from 'zod';

import { safetyClassifierConfig } from './data';
import { claudeJsonModel, type ClaudeModelOptions, type JsonModel } from './models';

const verdictSchema = z.strictObject({ distress: z.boolean() });

/**
 * The model half of the distress check, for lines the on-device rules pass. Any answer that is
 * not a clear "no distress" (a refusal, an unparseable reply) counts as distress.
 */
export function distressCheck(model: JsonModel) {
  return async (line: string): Promise<boolean> => {
    const reply = await model({
      system: safetyClassifierConfig.instructions,
      user: safetyClassifierConfig.request.replace('{{line}}', line),
      schema: verdictSchema,
      maxTokens: 2000,
      effort: 'low',
    });
    if (reply.refused) return true;
    try {
      return verdictSchema.parse(JSON.parse(reply.text)).distress;
    } catch {
      return true;
    }
  };
}

export const claudeDistressCheck = (options: ClaudeModelOptions) => distressCheck(claudeJsonModel(options));
