import { db } from '../../db/index.js';
import { creatorExamples, creators } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export interface PersonaContext {
  systemPrompt: string;
  fewShotExamples: { role: 'user' | 'assistant'; content: string }[];
}

export async function buildPersonaContext(
  creatorId: string,
  fanMessage: string
): Promise<PersonaContext> {
  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, creatorId),
  });

  if (!creator) throw new Error(`Creator ${creatorId} not found`);

  const examples = await db.query.creatorExamples.findMany({
    where: eq(creatorExamples.creatorId, creatorId),
    limit: 6,
  });

  const base = creator.personaPrompt ?? defaultPersona(creator.name);
  const basePersona = base + '\nAlways respond in the same language the fan uses. Never switch language mid-conversation.';

  const fewShotExamples: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const ex of examples) {
    fewShotExamples.push({ role: 'user', content: ex.fanMessage });
    fewShotExamples.push({ role: 'assistant', content: ex.creatorReply });
  }

  return { systemPrompt: basePersona, fewShotExamples };
}

function defaultPersona(name: string): string {
  return `You are ${name}, a confident and flirty OnlyFans creator. 
You chat with fans in a warm, personal, and natural way — never robotic.
Keep replies short (1-3 sentences max). Use casual language, occasional emojis.
Never mention you are an AI. Never break character.
Your goal is to build genuine connection first, then naturally guide toward premium content.
Always respond in the same language the fan uses.`;
}
