import { serve } from '@hono/node-server';

import { createApp, type Services } from './app';
import { drafter } from './drafter';
import { gradeModel } from './grader';
import type { JsonRequest } from './models';
import { modelsFromEnv } from './providers';
import { distressCheck } from './safety';
import { elevenLabsTokenMinter } from './voice';

const env = process.env;
const services: Services = {};

const models = modelsFromEnv(env);
if (models) {
  const effort = (env.GRADER_EFFORT ?? 'medium') as JsonRequest['effort'];
  services.gradeModelFor = (scenario) => gradeModel(models.grader, effort, scenario);
  services.draftScenario = drafter(models.drafter);
  services.checkDistress = distressCheck(models.safety);
}

if (env.ELEVENLABS_API_KEY && env.ELEVENLABS_AGENT_ID) {
  services.mintVoiceToken = elevenLabsTokenMinter({
    apiKey: env.ELEVENLABS_API_KEY,
    agentId: env.ELEVENLABS_AGENT_ID,
  });
}

const port = Number(env.PORT ?? 8787);
const noModel = 'off (set ANTHROPIC_API_KEY, or MODEL_BASE_URL and GRADER_MODEL)';
serve({ fetch: createApp(services).fetch, port }, () => {
  console.log(`HardTalk server on http://localhost:${port}`);
  console.log(`  models:  ${models ? models.name : 'none'}`);
  console.log(`  grading: ${services.gradeModelFor ? 'on' : noModel}`);
  console.log(`  voice:   ${services.mintVoiceToken ? 'on' : 'off (set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID)'}`);
  console.log(`  drafts:  ${services.draftScenario ? 'on' : noModel}`);
  console.log(`  safety:  rules on; model check ${services.checkDistress ? 'on' : noModel}`);
});
