class Postgres {
  static ConnectionString: string = process.env.DATABASE_URL || ''
}

class Telegram {
  static BotToken: string = process.env.TELEGRAM_BOT_TOKEN || ''
  static BotUrl: string = process.env.TELEGRAM_BOT_URL || ''
}

class CronJob {
  static Schedule = process.env.CRONJOB_SCHEDULE || '*/5 * * * *'
}

export { Telegram, CronJob, Postgres }
