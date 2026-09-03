import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { auditLog } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { killCreator, reviveCreator } from '../../core/safety/kill-switch.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const safetyRouter = Router();
safetyRouter.use(authMiddleware);

safetyRouter.post('/kill/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const reason: string = Array.isArray(req.body.reason) ? req.body.reason[0] : (req.body.reason ?? 'Manual kill');
    await killCreator(creatorId, reason);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

safetyRouter.post('/revive/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    await reviveCreator(creatorId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

safetyRouter.get('/audit/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const logs = await db.query.auditLog.findMany({
      where: eq(auditLog.creatorId, creatorId),
      orderBy: [desc(auditLog.timestamp)],
      limit: 100,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});