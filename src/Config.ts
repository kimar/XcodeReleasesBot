class Redis {
  static Host: string = process.env.REDIS_HOST || ''
  static Port: number = parseInt(process.env.REDIS_PORT || '') || 0
  static Password: string = process.env.REDIS_PASSWORD || ''
}

class Telegram {
  static BotToken: string = process.env.TELEGRAM_BOT_TOKEN || ''
}

class CronJob {
  static Schedule = process.env.CRONJOB_SCHEDULE || '0 */1 * * *'
}

export { Redis, Telegram, CronJob }
