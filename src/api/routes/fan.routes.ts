import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { fans, messages } from '../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const fanRouter = Router();
fanRouter.use(authMiddleware);

fanRouter.get('/:creatorId', async (req: AuthRequest, res: Response) => {
  try {
    const fanList = await db.query.fans.findMany({
      where: eq(fans.creatorId, req.params.creatorId),
      orderBy: [desc(fans.totalSpent)],
    });
    res.json(fanList);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

fanRouter.get('/:creatorId/:fanId', async (req: AuthRequest, res: Response) => {
  try {
    const fan = await db.query.fans.findFirst({
      where: and(eq(fans.id, req.params.fanId), eq(fans.creatorId, req.params.creatorId)),
    });

    if (!fan) {
      res.status(404).json({ error: 'Fan not found' });
      return;
    }

    const recentMessages = await db.query.messages.findMany({
      where: eq(messages.fanId, fan.id),
      orderBy: [desc(messages.sentAt)],
      limit: 50,
    });

    res.json({ fan, recentMessages });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});