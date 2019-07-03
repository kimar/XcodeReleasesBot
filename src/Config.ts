class Postgres {
  static ConnectionString: string = process.env.DATABASE_URL || ''
}

class Telegram {
  static BotToken: string = process.env.TELEGRAM_BOT_TOKEN || ''
}

class CronJob {
  static Schedule = process.env.CRONJOB_SCHEDULE || '*/5 * * * *'
}

export { Telegram, CronJob, Postgres }
