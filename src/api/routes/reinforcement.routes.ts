import { Router, Response } from 'express';
import { markConversationAsSuccess, getConversionPatterns } from '../../core/sales/reinforcement.js';
import { calculateAgentScore, getAgentRanking } from '../../core/sales/agent-scoring.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const reinforcementRouter = Router();
reinforcementRouter.use(authMiddleware);

// Segna conversazione come vendita riuscita
reinforcementRouter.post('/success', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { creatorId, fanId, ppvPrice } = req.body;
    await markConversationAsSuccess(creatorId, fanId, ppvPrice ?? 0);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Pattern conversione per creator
reinforcementRouter.get('/patterns/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patterns = await getConversionPatterns(req.params.creatorId as string);
    res.json(patterns);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Score singolo agent
reinforcementRouter.get('/score/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const score = await calculateAgentScore(req.params.creatorId as string);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Ranking tutti gli agent dell'agenzia
reinforcementRouter.get('/ranking', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ranking = await getAgentRanking(req.agencyId!);
    res.json(ranking);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});