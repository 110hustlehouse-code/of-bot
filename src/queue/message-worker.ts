import { Worker, Queue, Job } from 'bullmq';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface MessageJob {
  creatorId: string;
}

const connection = { url: env.REDIS_URL };
export const pollQueue = new Queue<MessageJob>('poll-messages', { connection });

export function startMessageWorker(): Worker {
  const worker = new Worker<MessageJob>(
    'poll-messages',
    async (job: Job<MessageJob>) => {
      const { isKilled } = await import('../core/safety/kill-switch.js');
      const { eq } = await import('drizzle-orm');
      const { db } = await import('../db/index.js');
      const { creators, messages } = await import('../db/schema.js');
      const { pollNewMessages, sendMessage } = await import('../core/of-client/messages.js');
      const { isAccountValid } = await import('../core/of-client/session-manager.js');
      const { buildPersonaContext } = await import('../core/ai/persona-engine.js');
      const { getOrCreateFan, buildMemoryContext, extractAndUpdateMemory, updateFanActivity } = await import('../core/ai/memory-engine.js');
      const { callLLM, routeModel } = await import('../core/ai/llm-router.js');
      const { checkCompliance, logMessageSent } = await import('../core/ai/compliance.js');
      const { calculateHeatScore, updateFanTier } = await import('../core/sales/smart-timing.js');
      const { determineSalesPhase } = await import('../core/sales/state-machine.js');
      const { decrypt } = await import('../utils/crypto.js');

      const { creatorId } = job.data;

      if (isKilled(creatorId)) return;

      const creator = await db.query.creators.findFirst({
        where: eq(creators.id, creatorId),
      });
      if (!creator || !creator.isActive) return;

      // ofCredentialsEnc ora contiene l'accountId di OnlyFansAPI
      const accountId = decrypt(creator.ofCredentialsEnc);
      
      // Verifica sessione ancora valida
      const valid = await isAccountValid(accountId);
      if (!valid) {
        logger.warn(`Account ${accountId} needs re-auth for creator ${creatorId}`);
        return;
      }

      const newMessages = await pollNewMessages(accountId, creatorId);
      if (newMessages.length === 0) return;

      for (const msg of newMessages) {
        try {
          const memory = await getOrCreateFan(creatorId, msg.fanId, msg.fanName);

          await db.insert(messages).values({
            creatorId,
            fanId: memory.fanId,
            direction: 'in',
            content: msg.content,
            isAi: false,
          });

          const heat = calculateHeatScore(memory, msg.content, memory.messageCount, 2);
          const salesContext = determineSalesPhase(memory, heat);
          const persona = await buildPersonaContext(creatorId, msg.content);
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
            { role: 'user' as const, content: msg.content },
          ];

          const response = await callLLM({ model, systemPrompt, messages: llmMessages, maxTokens: 300 });
          const replyText = response.text.trim();

          const compliance = await checkCompliance(replyText, creatorId, memory.fanId);
          if (!compliance.allowed) {
            logger.warn(`Blocked for fan ${msg.fanId}: ${compliance.reason}`);
            continue;
          }

          const sent = await sendMessage(accountId, msg.fanId, replyText);
          if (!sent) continue;

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
          await extractAndUpdateMemory(memory.fanId, msg.content, memory.personalNotes);
          await updateFanActivity(memory.fanId);
          await updateFanTier(memory.fanId, memory.totalSpent);

          logger.info(`Reply sent to ${msg.fanId} [${model}] phase:${salesContext.phase}`);
        } catch (err) {
          logger.error(`processMessage failed for fan ${msg.fanId}: ${err}`);
        }
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Job failed for creator ${job?.data.creatorId}: ${err.message}`);
  });

  logger.info('Message worker started');
  return worker;
}
