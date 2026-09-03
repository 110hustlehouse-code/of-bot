import { db } from '../../db/index.js';
import { fans } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { callLLM } from './llm-router.js';
import { logger } from '../../utils/logger.js';

export interface FanMemory {
  fanId: string;
  displayName: string;
  tier: string;
  totalSpent: number;
  messageCount: number;
  personalNotes: Record<string, any>;
  emotionalState: string | null;
  lastActive: Date | null;
  ppvConversionRate: number;
}

export async function getFanMemory(
  creatorId: string,
  ofFanId: string
): Promise<FanMemory | null> {
  const fan = await db.query.fans.findFirst({
    where: and(eq(fans.creatorId, creatorId), eq(fans.ofFanId, ofFanId)),
  });

  if (!fan) return null;

  return {
    fanId: fan.id,
    displayName: fan.displayName ?? 'Fan',
    tier: fan.tier ?? 'cold',
    totalSpent: fan.totalSpent ?? 0,
    messageCount: fan.messageCount ?? 0,
    personalNotes: (fan.personalNotes as Record<string, any>) ?? {},
    emotionalState: fan.emotionalState,
    lastActive: fan.lastActive,
    ppvConversionRate: fan.ppvConversionRate ?? 0,
  };
}

export async function getOrCreateFan(
  creatorId: string,
  ofFanId: string,
  displayName: string
): Promise<FanMemory> {
  const existing = await getFanMemory(creatorId, ofFanId);
  if (existing) return existing;

  await db.insert(fans).values({
    creatorId,
    ofFanId,
    displayName,
    tier: 'cold',
    personalNotes: {},
    messageCount: 0,
    totalSpent: 0,
  });

  return (await getFanMemory(creatorId, ofFanId))!;
}

// Costruisce il context memory da iniettare nel prompt
export function buildMemoryContext(memory: FanMemory): string {
  const notes = Object.entries(memory.personalNotes)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  return `
FAN PROFILE:
- Name: ${memory.displayName}
- Tier: ${memory.tier} (${memory.totalSpent}$ spent total)
- Messages exchanged: ${memory.messageCount}
- Emotional state: ${memory.emotionalState ?? 'unknown'}
- PPV conversion rate: ${(memory.ppvConversionRate * 100).toFixed(0)}%
${notes ? `- Personal notes:\n${notes}` : ''}
`.trim();
}

// Estrae nuove info personali dal messaggio del fan e aggiorna il profilo
export async function extractAndUpdateMemory(
  fanDbId: string,
  fanMessage: string,
  currentNotes: Record<string, any>
): Promise<void> {
  try {
    const response = await callLLM({
      model: 'haiku',
      maxTokens: 200,
      systemPrompt: `Extract personal facts from the fan message that are worth remembering for future conversations.
Return a JSON object with key-value pairs only. Examples: {"likes_feet": true, "dog_name": "Rex", "birthday_month": "march", "works_night_shift": true}.
If nothing notable, return {}.
Return ONLY valid JSON, no explanation.`,
      messages: [{ role: 'user', content: fanMessage }],
    });

    const extracted = JSON.parse(response.text.trim());
    if (Object.keys(extracted).length === 0) return;

    const updatedNotes = { ...currentNotes, ...extracted };

    await db
      .update(fans)
      .set({
        personalNotes: updatedNotes,
        messageCount: db.$count(fans) as any, // aggiornato nel worker
        lastActive: new Date(),
      })
      .where(eq(fans.id, fanDbId));

    logger.debug(`Memory updated for fan ${fanDbId}: ${JSON.stringify(extracted)}`);
  } catch {
    // Non bloccare il flusso se l'estrazione fallisce
  }
}

export async function updateFanActivity(fanDbId: string): Promise<void> {
  await db
    .update(fans)
    .set({ lastActive: new Date() })
    .where(eq(fans.id, fanDbId));
}