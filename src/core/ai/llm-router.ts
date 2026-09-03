import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export type LLMModel = 'haiku' | 'sonnet';

export interface LLMResponse {
  text: string;
  model: LLMModel;
  inputTokens: number;
  outputTokens: number;
}

export interface LLMRequest {
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  model?: LLMModel;
  maxTokens?: number;
}

const MODELS = {
  haiku: 'claude-haiku-4-5',
  sonnet: 'claude-sonnet-4-6',
};

// Decide automaticamente quale modello usare in base al contesto
export function routeModel(context: {
  isWhale: boolean;
  isPpvDecision: boolean;
  isComplianceCheck: boolean;
}): LLMModel {
  if (context.isWhale || context.isPpvDecision || context.isComplianceCheck) {
    return 'sonnet';
  }
  return 'haiku';
}

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const model = request.model ?? 'haiku';
  const modelId = MODELS[model];

  const response = await client.messages.create({
    model: modelId,
    max_tokens: request.maxTokens ?? 300,
    system: request.systemPrompt,
    messages: request.messages,
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text)
    .join('');

  return {
    text,
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}