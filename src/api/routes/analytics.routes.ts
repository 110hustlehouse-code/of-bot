import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { fans, messages, ppvEvents, creators } from '../../db/schema.js';
import { eq, and, sum, count, avg } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

analyticsRouter.get('/creator/:creatorId', async (req: AuthRequest, res: Response) => {
  try {
    const [fanStats] = await db.select({
      totalFans: count(fans.id),
      totalRevenue: sum(fans.totalSpent),
      avgSpend: avg(fans.totalSpent),
    }).from(fans).where(eq(fans.creatorId, req.params.creatorId));

    const [msgStats] = await db.select({
      totalMessages: count(messages.id),
      aiMessages: count(messages.isAi),
    }).from(messages).where(eq(messages.creatorId, req.params.creatorId));

    const [ppvStats] = await db.select({
      totalSent: count(ppvEvents.id),
      totalPurchased: count(ppvEvents.purchased),
    }).from(ppvEvents).where(eq(ppvEvents.creatorId, req.params.creatorId));

    const conversionRate = ppvStats.totalSent > 0
      ? Number(ppvStats.totalPurchased) / Number(ppvStats.totalSent)
      : 0;

    res.json({ fanStats, msgStats, ppvStats: { ...ppvStats, conversionRate } });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

analyticsRouter.get('/agency', async (req: AuthRequest, res: Response) => {
  try {
    const agencyCreators = await db.query.creators.findMany({
      where: eq(creators.agencyId, req.agencyId!),
    });

    const stats = await Promise.all(agencyCreators.map(async (c) => {
      const [s] = await db.select({
        totalFans: count(fans.id),
        totalRevenue: sum(fans.totalSpent),
      }).from(fans).where(eq(fans.creatorId, c.id));

      return { creatorId: c.id, name: c.name, isActive: c.isActive, ...s };
    }));

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});