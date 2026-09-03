import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { fans, messages, ppvEvents, creators } from '../../db/schema.js';
import { eq, count, sum, avg, and, gte, sql } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

analyticsRouter.get('/creator/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    // Fan stats
    const [fanStats] = await db.select({
      totalFans: count(fans.id),
      totalRevenue: sum(fans.totalSpent),
      avgSpend: avg(fans.totalSpent),
    }).from(fans).where(eq(fans.creatorId, creatorId));

    // Tier breakdown
    const tierBreakdown = await db.select({
      tier: fans.tier,
      count: count(fans.id),
      revenue: sum(fans.totalSpent),
    }).from(fans)
      .where(eq(fans.creatorId, creatorId))
      .groupBy(fans.tier);

    // Messaggi totali vs AI
    const [msgStats] = await db.select({
      totalMessages: count(messages.id),
    }).from(messages).where(eq(messages.creatorId, creatorId));

    const [aiMsgStats] = await db.select({
      aiMessages: count(messages.id),
    }).from(messages).where(
      and(eq(messages.creatorId, creatorId), eq(messages.isAi, true))
    );

    // PPV stats totali
    const [ppvTotal] = await db.select({
      totalSent: count(ppvEvents.id),
    }).from(ppvEvents).where(eq(ppvEvents.creatorId, creatorId));

    const [ppvPurchased] = await db.select({
      totalPurchased: count(ppvEvents.id),
    }).from(ppvEvents).where(
      and(eq(ppvEvents.creatorId, creatorId), eq(ppvEvents.purchased, true))
    );

    // PPV generati dall'AI
    const [aiPpv] = await db.select({
      aiGenerated: count(ppvEvents.id),
    }).from(ppvEvents).where(
      and(eq(ppvEvents.creatorId, creatorId), eq(ppvEvents.aiTriggered, true), eq(ppvEvents.purchased, true))
    );

    // Revenue ultimi 30 giorni
    const [recentRevenue] = await db.select({
      revenue30d: sum(fans.totalSpent),
    }).from(fans).where(
      and(eq(fans.creatorId, creatorId), gte(fans.lastActive, thirtyDaysAgo))
    );

    // Churn risk breakdown
    const churnBreakdown = await db.select({
      tier: fans.tier,
      count: count(fans.id),
    }).from(fans).where(
      and(eq(fans.creatorId, creatorId), gte(fans.lastActive, new Date(Date.now() - 7 * 24 * 3600 * 1000)))
    ).groupBy(fans.tier);

    const totalSent = Number(ppvTotal.totalSent ?? 0);
    const totalPurchased = Number(ppvPurchased.totalPurchased ?? 0);
    const aiGenerated = Number(aiPpv.aiGenerated ?? 0);
    const totalMessages = Number(msgStats.totalMessages ?? 0);
    const aiMessages = Number(aiMsgStats.aiMessages ?? 0);

    res.json({
      fanStats: {
        totalFans: Number(fanStats.totalFans ?? 0),
        totalRevenue: Number(fanStats.totalRevenue ?? 0),
        avgSpend: Number(fanStats.avgSpend ?? 0),
        revenue30d: Number(recentRevenue.revenue30d ?? 0),
      },
      tierBreakdown,
      msgStats: {
        totalMessages,
        aiMessages,
        aiPercentage: totalMessages > 0 ? ((aiMessages / totalMessages) * 100).toFixed(1) : '0',
      },
      ppvStats: {
        totalSent,
        totalPurchased,
        conversionRate: totalSent > 0 ? (totalPurchased / totalSent) : 0,
        aiGenerated,
        aiRevenue: aiGenerated, // placeholder — aggiornare con prezzo reale
        aiContribution: totalPurchased > 0 ? ((aiGenerated / totalPurchased) * 100).toFixed(1) : '0',
      },
      churnBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

analyticsRouter.get('/agency', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const agencyCreators = await db.query.creators.findMany({
      where: eq(creators.agencyId, req.agencyId!),
    });

    const stats = await Promise.all(agencyCreators.map(async (c) => {
      const [s] = await db.select({
        totalFans: count(fans.id),
        totalRevenue: sum(fans.totalSpent),
      }).from(fans).where(eq(fans.creatorId, c.id));

      const [ppv] = await db.select({
        aiGenerated: count(ppvEvents.id),
      }).from(ppvEvents).where(
        and(eq(ppvEvents.creatorId, c.id), eq(ppvEvents.aiTriggered, true), eq(ppvEvents.purchased, true))
      );

      return {
        creatorId: c.id,
        name: c.name,
        isActive: c.isActive,
        totalFans: Number(s.totalFans ?? 0),
        totalRevenue: Number(s.totalRevenue ?? 0),
        aiGeneratedSales: Number(ppv.aiGenerated ?? 0),
      };
    }));

    const totals = {
      totalCreators: stats.length,
      activeCreators: stats.filter(s => s.isActive).length,
      totalRevenue: stats.reduce((a, s) => a + s.totalRevenue, 0),
      totalAiSales: stats.reduce((a, s) => a + s.aiGeneratedSales, 0),
    };

    res.json({ totals, creators: stats });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});