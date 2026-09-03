import { db } from '../../db/index.js';
import { ppvEvents, fans, messages } from '../../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { callLLM } from '../ai/llm-router.js';
import { sendMessage } from '../of-client/messages.js';
import { logMessageSent } from '../ai/compliance.js';
import { logger } from '../../utils/logger.js';

const UPSELL_DELAY_MS = 10 * 60 * 1000; // 10 minuti dopo acquisto PPV
const MIN_HOURS_BETWEEN_UPSELL = 24;

export async function handlePostPpvUpsell(
  creatorId: string,
  fanId: string,
  ofFanId: string,
  fanName: string,
  lastPpvPrice: number,
  personaPrompt: string,
  page: any
): Promise<void> {
  // Evita upsell troppo frequenti
  const recentUpsell = await db.query.ppvEvents.findFirst({
    where: and(
      eq(ppvEvents.creatorId, creatorId),
      eq(ppvEvents.fanId, fanId),
      gt(ppvEvents.sentAt, new Date(Date.now() - MIN_HOURS_BETWEEN_UPSELL * 3600 * 1000))
    ),
  });

  if (recentUpsell) {
    logger.debug(`Upsell skipped for fan ${fanId} — too recent`);
    return;
  }

  // Aspetta 10 minuti prima di mandare upsell
  await new Promise((resolve) => setTimeout(resolve, UPSELL_DELAY_MS));

  const response = await callLLM({
    model: 'haiku',
    maxTokens: 150,
    systemPrompt: `${personaPrompt}
You just sold a PPV to ${fanName} for $${lastPpvPrice}.
Write a short, warm aftercare message (1-2 sentences) that:
1. References they just got your content (without being explicit)
2. Teases that you have something else special for them
3. Feels natural and personal, not salesy
Never mention prices. Never say "buy". Keep it flirty and warm.`,
    messages: [{ role: 'user', content: `Send aftercare message to ${fanName}` }],
  });

  const upsellText = response.text.trim();
  if (!upsellText) return;

  const sent = await sendMessage(page, ofFanId, upsellText);
  if (!sent) return;

  // Salva nel DB
  await db.insert(messages).values({
    creatorId,
    fanId,
    direction: 'out',
    content: upsellText,
    isAi: true,
    aiModel: 'haiku',
    salesPhase: 'upsell',
    complianceChecked: true,
  });

  await db.insert(ppvEvents).values({
    creatorId,
    fanId,
    aiTriggered: true,
  });

  await logMessageSent(creatorId, fanId, upsellText);
  logger.info(`Post-PPV upsell sent to fan ${fanId}`);
}

// Chiamato dal worker dopo ogni acquisto PPV rilevato
export async function checkAndTriggerUpsell(
  creatorId: string,
  fanId: string,
  ofFanId: string,
  fanName: string,
  personaPrompt: string,
  page: any
): Promise<void> {
  const lastPurchase = await db.query.ppvEvents.findFirst({
    where: and(
      eq(ppvEvents.fanId, fanId),
      eq(ppvEvents.purchased, true)
    ),
  });

  if (!lastPurchase) return;

  handlePostPpvUpsell(
    creatorId,
    fanId,
    ofFanId,
    fanName,
    lastPurchase.ppvPrice ?? 0,
    personaPrompt,
    page
  ).catch((err) => logger.error(`Upsell error for fan ${fanId}: ${err}`));
}