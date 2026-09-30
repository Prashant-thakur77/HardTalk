import Anthropic from '@anthropic-ai/sdk';
import { serve } from '@hono/node-server';

import { createApp, type Services } from './app';
import { claudeDrafter } from './drafter';
import { claudeGradeModel } from './grader';
import { claudeDistressCheck } from './safety';
import { elevenLabsTokenMinter } from './voice';

const env = process.env;
const services: Services = {};

if (env.ANTHROPIC_API_KEY) {
  const grader = {
    client: new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }),
    model: env.GRADER_MODEL ?? 'claude-opus-5',
    effort: (env.GRADER_EFFORT ?? 'medium') as 'low' | 'medium' | 'high',
  };
  services.gradeModelFor = (scenario) => claudeGradeModel(grader, scenario);
  services.draftScenario = claudeDrafter({ client: grader.client, model: env.DRAFTER_MODEL ?? 'claude-opus-5-5' });
  services.checkDistress = claudeDistressCheck({
    client: grader.client,
    model: env.SAFETY_MODEL ?? 'claude-opus-5',
  });
}

if (env.ELEVENLABS_API_KEY && env.ELEVENLABS_AGENT_ID) {
  services.mintVoiceToken = elevenLabsTokenMinter({
    apiKey: env.ELEVENLABS_API_KEY,
    agentId: env.ELEVENLABS_AGENT_ID,
  });
}

const port = Number(env.PORT ?? 8787);
serve({ fetch: createApp(services).fetch, port }, () => {
  console.log(`HardTalk server on http://localhost:${port}`);
  console.log(`  grading: ${services.gradeModelFor ? 'on' : 'off (set ANTHROPIC_API_KEY)'}`);
  console.log(`  voice:   ${services.mintVoiceToken ? 'on' : 'off (set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID)'}`);
  console.log(`  drafts:  ${services.draftScenario ? 'on' : 'off (set ANTHROPIC_API_KEY)'}`);
  console.log(`  safety:  rules on; model check ${services.checkDistress ? 'on' : 'off (set ANTHROPIC_API_KEY)'}`);
});
