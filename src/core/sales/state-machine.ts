import { db } from '../../db/index.js';
import { fans } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { FanMemory } from '../ai/memory-engine.js';
import { HeatScore } from './smart-timing.js';

export type SalesPhase = 'warmup' | 'flirt' | 'tease' | 'pitch' | 'upsell' | 'aftercare';

export interface SalesContext {
  phase: SalesPhase;
  shouldPitchPpv: boolean;
  phaseInstructions: string;
}

export function determineSalesPhase(
  memory: FanMemory,
  heat: HeatScore
): SalesContext {
  const { messageCount, totalSpent, tier } = memory;

  // Fase basata su storia + calore attuale
  if (messageCount < 5) {
    return {
      phase: 'warmup',
      shouldPitchPpv: false,
      phaseInstructions: `Focus on building connection. Ask questions, show genuine interest. 
DO NOT mention any paid content yet. Just be warm and engaging.`,
    };
  }

  if (messageCount < 15 && totalSpent === 0) {
    return {
      phase: 'flirt',
      shouldPitchPpv: false,
      phaseInstructions: `Be flirty and playful. Tease a little. Build desire. 
You can hint at exclusive content but don't push yet.`,
    };
  }

  if (heat.isHot && totalSpent === 0) {
    return {
      phase: 'tease',
      shouldPitchPpv: true,
      phaseInstructions: `The fan is engaged. Naturally mention you have something special for them.
Be soft about it — "I just posted something I think you'd love..." not a hard sell.`,
    };
  }

  if (heat.isHot && totalSpent > 0) {
    return {
      phase: 'upsell',
      shouldPitchPpv: true,
      phaseInstructions: `This fan has bought before. They trust you. 
Reference their past purchase positively, then offer new exclusive content naturally.`,
    };
  }

  if (tier === 'whale') {
    return {
      phase: 'aftercare',
      shouldPitchPpv: heat.score > 80,
      phaseInstructions: `This is a VIP fan. Make them feel special and appreciated.
Personal attention, remember their details, make them feel like your favorite.
Only pitch PPV if the moment is truly right (score > 80).`,
    };
  }

  // Default: continua a scaldare
  return {
    phase: 'flirt',
    shouldPitchPpv: false,
    phaseInstructions: `Keep building the relationship. Be engaging, fun, a little flirty.`,
  };
}