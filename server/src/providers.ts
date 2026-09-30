import Anthropic from '@anthropic-ai/sdk';

import { claudeJsonModel, openAiCompatibleJsonModel, type JsonModel } from './models';

/** The models behind grading, drafting and the safety check, as configured in server/.env. */
export interface ModelSetup {
  /** For logs and eval labels, e.g. "claude-opus-5" or "qwen2.5:7b at http://localhost:11434/v1". */
  name: string;
  graderId: string;
  grader: JsonModel;
  drafter: JsonModel;
  safety: JsonModel;
}

/**
 * Claude when ANTHROPIC_API_KEY is set. Otherwise MODEL_BASE_URL and GRADER_MODEL point at any
 * OpenAI-compatible API: Gemini's free tier, a local Ollama model, Grok. Null when neither is set.
 */
export function modelsFromEnv(env: NodeJS.ProcessEnv = process.env): ModelSetup | null {
  if (env.ANTHROPIC_API_KEY) {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const model = (id: string) => claudeJsonModel({ client, model: id });
    const graderId = env.GRADER_MODEL ?? 'claude-opus-5';
    return {
      name: graderId,
      graderId,
      grader: model(graderId),
      drafter: model(env.DRAFTER_MODEL ?? 'claude-opus-5-5'),
      safety: model(env.SAFETY_MODEL ?? 'claude-opus-5'),
    };
  }
  if (env.MODEL_BASE_URL && env.GRADER_MODEL) {
    const baseUrl = env.MODEL_BASE_URL;
    const model = (id: string) => openAiCompatibleJsonModel({ baseUrl, apiKey: env.MODEL_API_KEY || undefined, model: id });
    const graderId = env.GRADER_MODEL;
    return {
      name: `${graderId} at ${baseUrl}`,
      graderId,
      grader: model(graderId),
      drafter: model(env.DRAFTER_MODEL ?? graderId),
      safety: model(env.SAFETY_MODEL ?? graderId),
    };
  }
  return null;
}
