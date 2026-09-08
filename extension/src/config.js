const CONFIG = {
  API_URL: 'https://api.aurafullsuite.it',

  // Polling
  POLL_INTERVAL: 10000,

  // Human-like delays (ms)
  MIN_REPLY_DELAY: 2000,
  MAX_REPLY_DELAY: 5000,
  TYPING_SPEED_MIN: 20,
  TYPING_SPEED_MAX: 60,
  PAUSE_BETWEEN_CHATS: 3000,

  // Dedup
  DEDUP_TIMEOUT: 300000,

  // API retry
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY: 2000,

  // Logging
  LOG_PREFIX: '[Aura]',
};