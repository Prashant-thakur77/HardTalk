import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

import { safetyClassifierConfig } from './data';

const verdictSchema = z.strictObject({ distress: z.boolean() });
const { type, schema } = betaZodOutputFormat(verdictSchema);

export interface ClassifierOptions {
  client: Pick<Anthropic, 'beta'>;
  model: string;
}

/**
 * The model half of the distress check, for lines the on-device rules pass. Any answer that is
 * not a clear "no distress" (a refusal, an unparseable reply) counts as distress.
 */
export function claudeDistressCheck(options: ClassifierOptions) {
  return async (line: string): Promise<boolean> => {
    const response = await options.client.beta.messages.create({
      model: options.model,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: safetyClassifierConfig.instructions, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: safetyClassifierConfig.request.replace('{{line}}', line) }],
      output_config: { effort: 'low', format: { type, schema } },
    });
    if (response.stop_reason === 'refusal') return true;
    const text = response.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
    try {
      return verdictSchema.parse(JSON.parse(text)).distress;
    } catch {
      return true;
    }
  };
}
