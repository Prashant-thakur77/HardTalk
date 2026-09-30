import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

/** One structured-output call: instructions, a request, and the JSON schema the answer must follow. */
export interface JsonRequest {
  system: string;
  user: string;
  /** The answer's shape. Each provider turns it into the JSON schema form it accepts. */
  schema: z.ZodType;
  maxTokens: number;
  effort: 'low' | 'medium' | 'high';
}

/** The model's raw text, or `refused` when it declined. Parsing and validation stay with the caller. */
export interface JsonReply {
  text: string;
  refused: boolean;
}

/** The grader, the drafter and the safety check are written against this, not against one provider. */
export type JsonModel = (request: JsonRequest) => Promise<JsonReply>;

export interface ClaudeModelOptions {
  client: Pick<Anthropic, 'beta'>;
  model: string;
}

/** Claude with structured output. The system prompt is the same for every call of a kind, so it is cached. */
export function claudeJsonModel(options: ClaudeModelOptions): JsonModel {
  return async (request) => {
    const response = await options.client.beta.messages.create({
      model: options.model,
      max_tokens: request.maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: request.system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: request.user }],
      // The SDK's form moves what structured outputs cannot enforce (lengths, patterns) into
      // descriptions; the callers validate those after parsing.
      output_config: { effort: request.effort, format: { type: 'json_schema', schema: betaZodOutputFormat(request.schema).schema } },
    });
    const text = response.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
    return { text, refused: response.stop_reason === 'refusal' };
  };
}

export interface OpenAiCompatibleOptions {
  /** For example https://generativelanguage.googleapis.com/v1beta/openai or http://localhost:11434/v1. */
  baseUrl: string;
  /** Not needed for a local Ollama. */
  apiKey?: string;
  model: string;
  fetch?: typeof fetch;
}

interface ChatCompletion {
  choices?: { message?: { content?: string | null; refusal?: string | null }; finish_reason?: string }[];
}

/**
 * Any OpenAI-compatible chat API: Gemini, a local Ollama model, xAI's Grok, OpenRouter. It asks
 * for the JSON schema as structured output; a provider that rejects the schema (400) is asked
 * again for plain JSON with the schema in the instructions. Either way the caller validates the
 * answer and retries once, exactly as it does for Claude.
 */
export function openAiCompatibleJsonModel(options: OpenAiCompatibleOptions): JsonModel {
  const send = options.fetch ?? fetch;
  const url = `${options.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const headers = {
    'content-type': 'application/json',
    ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
  };
  const post = (request: JsonRequest, schemaInResponseFormat: boolean) => {
    // The full schema, enums and all: local models such as Ollama's enforce it with a grammar.
    const schema = z.toJSONSchema(request.schema, { io: 'input', unrepresentable: 'any' });
    const system = schemaInResponseFormat
      ? request.system
      : `${request.system}\n\nAnswer with one JSON object that follows this JSON schema:\n${JSON.stringify(schema)}`;
    return send(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: options.model,
        max_tokens: request.maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: request.user },
        ],
        response_format: schemaInResponseFormat
          ? { type: 'json_schema', json_schema: { name: 'answer', schema } }
          : { type: 'json_object' },
      }),
    });
  };

  return async (request) => {
    let response = await post(request, true);
    if (response.status === 400) response = await post(request, false);
    if (!response.ok) {
      throw new Error(`${options.model} answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }
    const choice = ((await response.json()) as ChatCompletion).choices?.[0];
    return {
      text: choice?.message?.content ?? '',
      refused: Boolean(choice?.message?.refusal) || choice?.finish_reason === 'content_filter',
    };
  };
}
