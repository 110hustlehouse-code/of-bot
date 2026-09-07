import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { creators, messages } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { buildPersonaContext } from '../../core/ai/persona-engine.js';
import { getOrCreateFan, buildMemoryContext, extractAndUpdateMemory, updateFanActivity } from '../../core/ai/memory-engine.js';
import { callLLM, routeModel } from '../../core/ai/llm-router.js';
import { checkCompliance, logMessageSent } from '../../core/ai/compliance.js';
import { calculateHeatScore, updateFanTier } from '../../core/sales/smart-timing.js';
import { determineSalesPhase } from '../../core/sales/state-machine.js';
import { isFanInTakeover } from './takeover.routes.js';
import { logger } from '../../utils/logger.js';

export const extensionRouter = Router();
extensionRouter.use(authMiddleware);

extensionRouter.post('/process', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { creatorId, fanId, fanName, fanMessage } = req.body;

    if (!creatorId || !fanId || !fanMessage) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });
    if (!creator) {
      res.status(404).json({ error: 'Creator not found' });
      return;
    }

    const memory = await getOrCreateFan(creatorId, `ext_${fanId}`, fanName);

    // Check takeover
    const inTakeover = await isFanInTakeover(creatorId, memory.fanId);
    if (inTakeover) {
      res.json({ reply: null, reason: 'takeover' });
      return;
    }

    // Salva messaggio in entrata
    await db.insert(messages).values({
      creatorId,
      fanId: memory.fanId,
      direction: 'in',
      content: fanMessage,
      isAi: false,
    });

    // Pipeline AI
    const heat = calculateHeatScore(memory, fanMessage, memory.messageCount, 2);
    const salesContext = determineSalesPhase(memory, heat);
    const persona = await buildPersonaContext(creatorId, fanMessage);
    const memoryContext = buildMemoryContext(memory);

    const systemPrompt = `${persona.systemPrompt}

${memoryContext}

CURRENT SALES PHASE: ${salesContext.phase}
${salesContext.phaseInstructions}
Heat score: ${heat.score}/100.
Keep reply natural, human, max 2-3 sentences.`;

    const model = routeModel({
      isWhale: memory.tier === 'whale',
      isPpvDecision: salesContext.shouldPitchPpv,
      isComplianceCheck: false,
    });

    const llmMessages = [
      ...persona.fewShotExamples,
      { role: 'user' as const, content: fanMessage },
    ];

    const response = await callLLM({ model, systemPrompt, messages: llmMessages, maxTokens: 300 });
    const replyText = response.text.trim();

    // Compliance
    const compliance = await checkCompliance(replyText, creatorId, memory.fanId);
    if (!compliance.allowed) {
      res.json({ reply: null, reason: 'compliance', flag: compliance.reason });
      return;
    }

    // Salva messaggio in uscita
    await db.insert(messages).values({
      creatorId,
      fanId: memory.fanId,
      direction: 'out',
      content: replyText,
      isAi: true,
      aiModel: model,
      salesPhase: salesContext.phase,
      complianceChecked: true,
    });

    await logMessageSent(creatorId, memory.fanId, replyText);
    await extractAndUpdateMemory(memory.fanId, fanMessage, memory.personalNotes);
    await updateFanActivity(memory.fanId);
    await updateFanTier(memory.fanId, memory.totalSpent);

    logger.info(`Extension reply for fan ${fanId} [${model}] phase:${salesContext.phase}`);
    res.json({ reply: replyText, model, phase: salesContext.phase, heat: heat.score });
  } catch (err) {
    logger.error(`Extension process error: ${err}`);
    res.status(500).json({ error: `${err}` });
  }
});