import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, real } from 'drizzle-orm/pg-core';

export const agencies = pgTable('agencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  telegramChatId: text('telegram_chat_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const creators = pgTable('creators', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').references(() => agencies.id),
  name: text('name').notNull(),
  ofUsername: text('of_username').notNull(),
  ofCredentialsEnc: text('of_credentials_enc').notNull(),
  personaPrompt: text('persona_prompt'),
  elevenLabsVoiceId: text('elevenlabs_voice_id'),
  telegramBotToken: text('telegram_bot_token'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const creatorExamples = pgTable('creator_examples', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => creators.id),
  fanMessage: text('fan_message').notNull(),
  creatorReply: text('creator_reply').notNull(),
  category: text('category'),
});

export const fans = pgTable('fans', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => creators.id),
  ofFanId: text('of_fan_id').notNull(),
  displayName: text('display_name'),
  totalSpent: real('total_spent').default(0),
  messageCount: integer('message_count').default(0),
  avgResponseTime: real('avg_response_time'),
  lastActive: timestamp('last_active'),
  tier: text('tier').default('cold'),
  personalNotes: jsonb('personal_notes'),
  emotionalState: text('emotional_state'),
  bestPpvTime: text('best_ppv_time'),
  lastPpvSent: timestamp('last_ppv_sent'),
  ppvConversionRate: real('ppv_conversion_rate'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => creators.id),
  fanId: uuid('fan_id').references(() => fans.id),
  direction: text('direction').notNull(),
  content: text('content').notNull(),
  isAi: boolean('is_ai').default(false),
  aiModel: text('ai_model'),
  salesPhase: text('sales_phase'),
  complianceChecked: boolean('compliance_checked').default(false),
  complianceFlag: text('compliance_flag'),
  sentAt: timestamp('sent_at').defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => creators.id),
  action: text('action').notNull(),
  details: jsonb('details'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const ppvEvents = pgTable('ppv_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => creators.id),
  fanId: uuid('fan_id').references(() => fans.id),
  ppvPrice: real('ppv_price'),
  purchased: boolean('purchased').default(false),
  aiTriggered: boolean('ai_triggered').default(false),
  sentAt: timestamp('sent_at').defaultNow(),
  purchasedAt: timestamp('purchased_at'),
});

export const mediaLibrary = pgTable('media_library', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => creators.id),
  type: text('type').notNull(), // photo, video, audio
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  category: text('category').default('general'), // teasing, explicit, casual, ppv
  tags: text('tags').array(),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const humanTakeover = pgTable('human_takeover', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => creators.id),
  fanId: uuid('fan_id').references(() => fans.id),
  isActive: boolean('is_active').default(true),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
});