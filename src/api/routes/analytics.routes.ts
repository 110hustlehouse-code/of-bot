import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { fans, messages, ppvEvents, creators } from '../../db/schema.js';
import { eq, count, sum, avg } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

analyticsRouter.get('/creator/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;

    const [fanStats] = await db.select({
      totalFans: count(fans.id),
      totalRevenue: sum(fans.totalSpent),
      avgSpend: avg(fans.totalSpent),
    }).from(fans).where(eq(fans.creatorId, creatorId));

    const [msgStats] = await db.select({
      totalMessages: count(messages.id),
    }).from(messages).where(eq(messages.creatorId, creatorId));

    const [ppvStats] = await db.select({
      totalSent: count(ppvEvents.id),
    }).from(ppvEvents).where(eq(ppvEvents.creatorId, creatorId));

    res.json({ fanStats, msgStats, ppvStats });
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
      return { creatorId: c.id, name: c.name, isActive: c.isActive, ...s };
    }));

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});