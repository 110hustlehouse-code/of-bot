import { db } from '../../db/index.js';
import { ppvEvents, messages, fans, creators } from '../../db/schema.js';
import { eq, and, count, sum, avg } from 'drizzle-orm';
import { logger } from '../../utils/logger.js';

export interface AgentScore {
  creatorId: string;
  creatorName: string;
  totalRevenue: number;
  totalConversions: number;
  conversionRate: number;
  avgRevenuePerFan: number;
  totalMessages: number;
  aiMessages: number;
  automationRate: number;
  score: number; // 0-100 composite score
}

export async function calculateAgentScore(creatorId: string): Promise<AgentScore> {
  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, creatorId),
  });

  // Revenue
  const [revStats] = await db.select({
    totalRevenue: sum(fans.totalSpent),
    totalFans: count(fans.id),
    avgRevenue: avg(fans.totalSpent),
  }).from(fans).where(eq(fans.creatorId, creatorId));

  // Conversioni
  const [convStats] = await db.select({
    totalSent: count(ppvEvents.id),
  }).from(ppvEvents).where(eq(ppvEvents.creatorId, creatorId));

  const [convSuccess] = await db.select({
    totalPurchased: count(ppvEvents.id),
  }).from(ppvEvents).where(and(eq(ppvEvents.creatorId, creatorId), eq(ppvEvents.purchased, true)));

  // Messaggi
  const [msgStats] = await db.select({
    total: count(messages.id),
  }).from(messages).where(eq(messages.creatorId, creatorId));

  const [aiMsgStats] = await db.select({
    aiTotal: count(messages.id),
  }).from(messages).where(and(eq(messages.creatorId, creatorId), eq(messages.isAi, true)));

  const totalRevenue = Number(revStats.totalRevenue ?? 0);
  const totalFans = Number(revStats.totalFans ?? 0);
  const totalSent = Number(convStats.totalSent ?? 0);
  const totalPurchased = Number(convSuccess.totalPurchased ?? 0);
  const totalMessages = Number(msgStats.total ?? 0);
  const aiMessages = Number(aiMsgStats.aiTotal ?? 0);

  const conversionRate = totalSent > 0 ? totalPurchased / totalSent : 0;
  const automationRate = totalMessages > 0 ? aiMessages / totalMessages : 0;
  const avgRevenuePerFan = totalFans > 0 ? totalRevenue / totalFans : 0;

  // Composite score 0-100
  const revenueScore = Math.min(totalRevenue / 1000, 1) * 30;
  const conversionScore = conversionRate * 30;
  const automationScore = automationRate * 20;
  const volumeScore = Math.min(totalMessages / 500, 1) * 20;
  const score = Math.round(revenueScore + conversionScore + automationScore + volumeScore);

  return {
    creatorId,
    creatorName: creator?.name ?? 'Unknown',
    totalRevenue,
    totalConversions: totalPurchased,
    conversionRate,
    avgRevenuePerFan,
    totalMessages,
    aiMessages,
    automationRate,
    score,
  };
}

// Ranking di tutti gli agent di un'agenzia
export async function getAgentRanking(agencyId: string): Promise<AgentScore[]> {
  const agencyCreators = await db.query.creators.findMany({
    where: eq(creators.agencyId, agencyId),
  });

  const scores = await Promise.all(
    agencyCreators.map(c => calculateAgentScore(c.id))
  );

  return scores.sort((a, b) => b.score - a.score);
}