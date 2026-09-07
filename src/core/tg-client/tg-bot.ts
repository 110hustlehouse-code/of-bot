import { Bot, Context } from 'grammy';
import { logger } from '../../utils/logger.js';
import { db } from '../../db/index.js';
import { fans, messages, creators } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getOrCreateFan, buildMemoryContext, extractAndUpdateMemory, updateFanActivity } from '../ai/memory-engine.js';
import { buildPersonaContext } from '../ai/persona-engine.js';
import { callLLM, routeModel } from '../ai/llm-router.js';
import { checkCompliance, logMessageSent } from '../ai/compliance.js';
import { calculateHeatScore, updateFanTier } from '../sales/smart-timing.js';
import { determineSalesPhase } from '../sales/state-machine.js';
import { notifyHandoff } from '../safety/telegram-notifier.js';

// Cache dei bot attivi: creatorId → Bot instance
const activeBots = new Map<string, Bot>();

export async function startTelegramBot(creatorId: string, botToken: string): Promise<void> {
  if (activeBots.has(creatorId)) {
    logger.warn(`TG bot already running for creator ${creatorId}`);
    return;
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, creatorId),
  });

  if (!creator) throw new Error(`Creator ${creatorId} not found`);

  const bot = new Bot(botToken);

  bot.on('message:text', async (ctx: Context) => {
    try {
      const fanTgId = ctx.from?.id?.toString();
      const fanName = ctx.from?.first_name ?? 'Fan';
      const fanMessage = ctx.message?.text;

      if (!fanTgId || !fanMessage) return;

      // Get/create fan profile (usa tgId come ofFanId per TG)
      const memory = await getOrCreateFan(creatorId, `tg_${fanTgId}`, fanName);

      // Salva messaggio in entrata
      await db.insert(messages).values({
        creatorId,
        fanId: memory.fanId,
        direction: 'in',
        content: fanMessage,
        isAi: false,
      });

      // Heat score + sales phase
      const heat = calculateHeatScore(memory, fanMessage, memory.messageCount, 2);
      const salesContext = determineSalesPhase(memory, heat);
      const persona = await buildPersonaContext(creatorId, fanMessage);
      const memoryContext = buildMemoryContext(memory);

      const systemPrompt = `${persona.systemPrompt}

${memoryContext}

PLATFORM: Telegram
CURRENT SALES PHASE: ${salesContext.phase}
${salesContext.phaseInstructions}
Heat score: ${heat.score}/100.
Keep reply natural, human, max 2-3 sentences.
You can suggest the fan to check your OnlyFans for exclusive content when appropriate.`;

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

      // Compliance check
      const compliance = await checkCompliance(replyText, creatorId, memory.fanId);
      if (!compliance.allowed) {
        logger.warn(`TG message blocked for fan ${fanTgId}: ${compliance.reason}`);
        // Cerca agency per notifica
        const agency = creator.agencyId
          ? await db.query.agencies.findFirst({ where: eq((await import('../../db/schema.js')).agencies.id, creator.agencyId) })
          : null;
        if ((agency as any)?.telegramChatId) {
          await notifyHandoff((agency as any).telegramChatId, creator.name, fanName, fanMessage, compliance.reason ?? 'Compliance block');
        }
        return;
      }

      // Typing simulation
      await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
      const typingDelay = Math.min(replyText.length * 30, 3000);
      await new Promise(r => setTimeout(r, typingDelay));

      // Invia risposta
      await ctx.reply(replyText);

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

      logger.info(`TG reply sent to ${fanTgId} [${model}] phase:${salesContext.phase}`);
    } catch (err) {
      logger.error(`TG message processing error: ${err}`);
    }
  });

  // Gestione comandi
  bot.command('start', async (ctx) => {
    const welcome = creator.personaPrompt
      ? `Hey ${ctx.from?.first_name ?? 'babe'} 💋`
      : `Hey ${ctx.from?.first_name ?? 'there'}! Welcome 💕`;
    await ctx.reply(welcome);
  });

  await bot.start();
  activeBots.set(creatorId, bot);
  logger.info(`TG bot started for creator ${creatorId}`);
}

export async function stopTelegramBot(creatorId: string): Promise<void> {
  const bot = activeBots.get(creatorId);
  if (bot) {
    await bot.stop();
    activeBots.delete(creatorId);
    logger.info(`TG bot stopped for creator ${creatorId}`);
  }
}

export function isTelegramBotRunning(creatorId: string): boolean {
  return activeBots.has(creatorId);
}

// Avvia tutti i bot TG per creator con token configurato
export async function startAllTelegramBots(): Promise<void> {
  const allCreators = await db.query.creators.findMany({
    where: eq(creators.isActive, true),
  });

  for (const creator of allCreators) {
    if ((creator as any).telegramBotToken) {
      try {
        await startTelegramBot(creator.id, (creator as any).telegramBotToken);
      } catch (err) {
        logger.error(`Failed to start TG bot for creator ${creator.id}: ${err}`);
      }
    }
  }
}