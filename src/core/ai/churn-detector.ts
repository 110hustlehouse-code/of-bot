import { db } from '../../db/index.js';
import { fans, messages } from '../../db/schema.js';
import { eq, desc, and, gte } from 'drizzle-orm';
import { callLLM } from './llm-router.js';
import { logger } from '../../utils/logger.js';

export type ChurnRisk = 'low' | 'medium' | 'high' | 'critical';

export interface ChurnAnalysis {
  risk: ChurnRisk;
  score: number;
  signals: string[];
  reactivationMessage: string | null;
}

export async function analyzeChurnRisk(
  fanDbId: string,
  creatorId: string,
  personaPrompt: string
): Promise<ChurnAnalysis> {
  const fan = await db.query.fans.findFirst({
    where: eq(fans.id, fanDbId),
  });

  if (!fan) return { risk: 'low', score: 0, signals: [], reactivationMessage: null };

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const recentMessages = await db.query.messages.findMany({
    where: and(eq(messages.fanId, fanDbId), gte(messages.sentAt, sevenDaysAgo)),
    orderBy: [desc(messages.sentAt)],
    limit: 20,
  });

  let score = 0;
  const signals: string[] = [];

  const daysSinceActive = fan.lastActive
    ? (Date.now() - fan.lastActive.getTime()) / (1000 * 3600 * 24)
    : 999;

  if (daysSinceActive > 7) { score += 40; signals.push('inactive_7d'); }
  else if (daysSinceActive > 3) { score += 20; signals.push('inactive_3d'); }

  const inboundCount = recentMessages.filter(m => m.direction === 'in').length;
  if (inboundCount === 0) { score += 30; signals.push('no_messages_7d'); }
  else if (inboundCount < 3) { score += 15; signals.push('low_messages'); }

  if (fan.tier === 'whale' && daysSinceActive > 3) {
    score += 20;
    signals.push('whale_inactive');
  }

  if ((fan.ppvConversionRate ?? 0) > 0.3 && inboundCount === 0) {
    score += 10;
    signals.push('high_converter_gone_silent');
  }

  score = Math.min(score, 100);

  const risk: ChurnRisk =
    score >= 70 ? 'critical' :
    score >= 50 ? 'high' :
    score >= 25 ? 'medium' : 'low';

  let reactivationMessage: string | null = null;
  if (risk === 'high' || risk === 'critical') {
    reactivationMessage = await generateReactivationMessage(
      fan.displayName ?? 'babe',
      (fan.personalNotes as Record<string, any>) ?? {},
      signals,
      personaPrompt
    );
  }

  logger.info(`Churn analysis fan ${fanDbId}: ${risk} (${score})`);
  return { risk, score, signals, reactivationMessage };
}

async function generateReactivationMessage(
  fanName: string,
  personalNotes: Record<string, any>,
  signals: string[],
  personaPrompt: string
): Promise<string> {
  const notesContext = Object.entries(personalNotes)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const response = await callLLM({
    model: 'sonnet',
    maxTokens: 150,
    systemPrompt: `${personaPrompt}
This fan (${fanName}) has been quiet lately. You want to reconnect naturally.
${notesContext ? `Personal details: ${notesContext}` : ''}
Write a short personal re-engagement message (1-2 sentences).
Feel genuine, warm, curious. Never mention they were gone. No prices, no selling.`,
    messages: [{ role: 'user', content: `Write reactivation message for ${fanName}` }],
  });

  return response.text.trim();
}

export async function runChurnDetectionCycle(
  creatorId: string,
  personaPrompt: string,
  sendFn: (ofFanId: string, text: string) => Promise<boolean>
): Promise<void> {
  const allFans = await db.query.fans.findMany({
    where: eq(fans.creatorId, creatorId),
  });

  for (const fan of allFans) {
    try {
      const analysis = await analyzeChurnRisk(fan.id, creatorId, personaPrompt);
      if (analysis.reactivationMessage && fan.ofFanId) {
        await sendFn(fan.ofFanId, analysis.reactivationMessage);
        logger.info(`Reactivation sent to fan ${fan.id} (${analysis.risk})`);
      }
    } catch (err) {
      logger.error(`Churn error for fan ${fan.id}: ${err}`);
    }
  }
}
