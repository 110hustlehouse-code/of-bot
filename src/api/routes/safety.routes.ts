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
    const reason = Array.isArray(req.body.reason) ? req.body.reason[0] : (req.body.reason ?? 'Manual kill by agency');
    await killCreator(req.params.creatorId, reason);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

safetyRouter.post('/revive/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await reviveCreator(req.params.creatorId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

safetyRouter.get('/audit/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await db.query.auditLog.findMany({
      where: eq(auditLog.creatorId, req.params.creatorId),
      orderBy: [desc(auditLog.timestamp)],
      limit: 100,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});