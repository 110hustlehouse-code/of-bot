import { callLLM } from './llm-router.js';
import { db } from '../../db/index.js';
import { auditLog } from '../../db/schema.js';
import { logger } from '../../utils/logger.js';

// Parole/pattern vietati da OnlyFans TOS
const BANNED_PATTERNS: RegExp[] = [
  /\bminor\b/i, /\bunder\s*18\b/i, /\b(13|14|15|16|17)\s*year/i,
  /\bchild\b/i, /\bkid\b/i, /\bteen\b/i,
  /\bbestiality\b/i, /\banimal\s*sex\b/i,
  /\brape\b/i, /\bnon.?consent\b/i,
  /\bsnuff\b/i, /\bscat\b/i,
  /\bescort\b/i, /\bprostitut/i,
  /\bdrug\s*deal/i, /\bnarcotics\b/i,
];

export interface ComplianceResult {
  allowed: boolean;
  flag: string | null;
  reason: string | null;
}

// Check veloce regex — blocca prima di chiamare LLM
function regexCheck(text: string): ComplianceResult {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        flag: 'BANNED_PATTERN',
        reason: `Pattern vietato: ${pattern.source}`,
      };
    }
  }
  return { allowed: true, flag: null, reason: null };
}

// Check LLM per casi ambigui — usato solo se regex passa
async function llmComplianceCheck(text: string): Promise<ComplianceResult> {
  const response = await callLLM({
    model: 'sonnet',
    maxTokens: 100,
    systemPrompt: `You are a content compliance checker for OnlyFans.
Analyze the message and respond ONLY with valid JSON:
{"allowed": true} if the message is safe to send.
{"allowed": false, "reason": "brief reason"} if it violates OnlyFans TOS.

Violations include: minors, non-consent, real escort/prostitution offers, drugs sales, bestiality.
Normal adult sexual content, roleplay, and explicit language are ALLOWED.`,
    messages: [{ role: 'user', content: text }],
  });

  try {
    const parsed = JSON.parse(response.text.trim());
    return {
      allowed: parsed.allowed,
      flag: parsed.allowed ? null : 'LLM_FLAG',
      reason: parsed.reason ?? null,
    };
  } catch {
    // Se il parsing fallisce, lascia passare (falso negativo meglio di blocco errato)
    return { allowed: true, flag: null, reason: null };
  }
}

export async function checkCompliance(
  text: string,
  creatorId: string,
  fanId: string
): Promise<ComplianceResult> {
  // Step 1: regex veloce
  const regexResult = regexCheck(text);
  if (!regexResult.allowed) {
    await logViolation(creatorId, fanId, text, regexResult);
    return regexResult;
  }

  // Step 2: LLM check solo se il testo sembra borderline
  const isBorderline = /\b(young|innocent|school|uniform|daddy|little\s*girl)\b/i.test(text);
  if (isBorderline) {
    const llmResult = await llmComplianceCheck(text);
    if (!llmResult.allowed) {
      await logViolation(creatorId, fanId, text, llmResult);
      return llmResult;
    }
  }

  return { allowed: true, flag: null, reason: null };
}

async function logViolation(
  creatorId: string,
  fanId: string,
  text: string,
  result: ComplianceResult
): Promise<void> {
  logger.warn(`Compliance violation for creator ${creatorId}: ${result.reason}`);
  await db.insert(auditLog).values({
    creatorId,
    action: 'msg_blocked',
    details: {
      fanId,
      flag: result.flag,
      reason: result.reason,
      textPreview: text.slice(0, 100),
    },
  });
}

export async function logMessageSent(
  creatorId: string,
  fanId: string,
  text: string
): Promise<void> {
  await db.insert(auditLog).values({
    creatorId,
    action: 'msg_sent',
    details: { fanId, textPreview: text.slice(0, 100) },
  });
}