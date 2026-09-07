import { db } from '../../db/index.js';
import { messages, ppvEvents, creatorExamples } from '../../db/schema.js';
import { eq, and, desc, gte } from 'drizzle-orm';
import { logger } from '../../utils/logger.js';

// Segna una conversazione come "riuscita" (ha portato a vendita)
export async function markConversationAsSuccess(
  creatorId: string,
  fanId: string,
  ppvPrice: number
): Promise<void> {
  // Salva evento PPV
  await db.insert(ppvEvents).values({
    creatorId,
    fanId,
    ppvPrice,
    purchased: true,
    aiTriggered: true,
    purchasedAt: new Date(),
  });

  // Estrai gli ultimi messaggi della conversazione (ultimi 20)
  const recentMessages = await db.query.messages.findMany({
    where: and(eq(messages.creatorId, creatorId), eq(messages.fanId, fanId)),
    orderBy: [desc(messages.sentAt)],
    limit: 20,
  });

  const reversed = recentMessages.reverse();

  // Estrai coppie fan→creator per alimentare il RAG
  const pairs: { fanMessage: string; creatorReply: string }[] = [];

  for (let i = 0; i < reversed.length - 1; i++) {
    if (reversed[i].direction === 'in' && reversed[i + 1].direction === 'out' && reversed[i + 1].isAi) {
      pairs.push({
        fanMessage: reversed[i].content,
        creatorReply: reversed[i + 1].content,
      });
    }
  }

  // Salva le coppie come esempi RAG con categoria "conversion_success"
  if (pairs.length > 0) {
    const values = pairs.map(p => ({
      creatorId,
      fanMessage: p.fanMessage,
      creatorReply: p.creatorReply,
      category: 'conversion_success',
    }));

    await db.insert(creatorExamples).values(values);
    logger.info(`Reinforcement: ${pairs.length} successful patterns saved for creator ${creatorId}`);
  }
}

// Analizza quali pattern portano a conversione
export async function getConversionPatterns(creatorId: string): Promise<{
  totalConversions: number;
  avgMessagesBeforeConversion: number;
  topPhases: Record<string, number>;
  successExamples: number;
}> {
  const conversions = await db.query.ppvEvents.findMany({
    where: and(eq(ppvEvents.creatorId, creatorId), eq(ppvEvents.purchased, true)),
  });

  const successExamples = await db.query.creatorExamples.findMany({
    where: and(eq(creatorExamples.creatorId, creatorId), eq(creatorExamples.category, 'conversion_success')),
  });

  // Conta fase più frequente pre-conversione
  const phaseCount: Record<string, number> = {};
  for (const conv of conversions) {
    if (conv.fanId) {
      const lastMsg = await db.query.messages.findFirst({
        where: and(eq(messages.fanId, conv.fanId), eq(messages.isAi, true)),
        orderBy: [desc(messages.sentAt)],
      });
      if (lastMsg?.salesPhase) {
        phaseCount[lastMsg.salesPhase] = (phaseCount[lastMsg.salesPhase] ?? 0) + 1;
      }
    }
  }

  return {
    totalConversions: conversions.length,
    avgMessagesBeforeConversion: 0, // TODO: calcolare
    topPhases: phaseCount,
    successExamples: successExamples.length,
  };
}