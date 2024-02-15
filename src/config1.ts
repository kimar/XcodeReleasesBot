class Postgres {
  static ConnectionString: string =
    process.env.DATABASE_URL ||
    `postgres://postgres:${process.env.POSTGRES_PASSWORD}@database:5432/postgres`
}

class Telegram {
  static BotToken: string = process.env.TELEGRAM_BOT_TOKEN || ''
  static BotUrl: string = process.env.TELEGRAM_BOT_URL || ''
}

class CronJob {
  static Schedule = process.env.CRONJOB_SCHEDULE || '0 */5 * * * *'
}

export { Telegram, CronJob, Postgres }
