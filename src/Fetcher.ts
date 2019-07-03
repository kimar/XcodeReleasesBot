import TelegramBot from 'node-telegram-bot-api'
import { CronJob } from 'cron'
import axios from 'axios'
import { Telegram, CronJob as CronJobConfig, Postgres } from './Config'

import { Pool } from 'pg'

const releasesUrl = 'https://xcodereleases.com/data.json'

export class Fetcher {
  private bot = new TelegramBot(Telegram.BotToken, { polling: true })
  private cronJob: CronJob
  private pool = new Pool({
    connectionString: Postgres.ConnectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })

  constructor() {
    this.cronJob = new CronJob(CronJobConfig.Schedule, async () => await this.poll())
    this.cronJob.start()

    this.bot.on('message', async msg => {
      if (!(await this.isSubscribed(msg.chat.id.toString()))) {
        await this.subscribe(msg.chat.id.toString())
        this.bot.sendMessage(
          msg.chat.id,
          `Hey there!\nYou'll get notified about the latest Xcode updates asap! 👍`
        )
      }

      if (['/help', '/h', 'help'].includes(msg.text || '')) {
        this.bot.sendMessage(
          msg.chat.id,
          `Available commands:\n
          /latest -> Responds with latest available Xcode release.\n
          /unsubscribe -> Don't get new Xcode release notifications.\n
          /users -> Returns the current number of subscribers of this bot.`
        )
      } else if (msg.text === '/latest') {
        const latestXcodeRelease = await this.fetchLatestXcodeRelease()
        if (latestXcodeRelease) {
          this.sendLatestMessage(latestXcodeRelease, msg.chat.id.toString())
        }
      } else if (msg.text === '/users') {
        this.bot.sendMessage(
          msg.chat.id,
          `Currently ${await this.getSubscriberCount()} people are using this bot. 🎉`
        )
      } else if (msg.text === '/unsubscribe') {
        await this.unsubscribe(msg.chat.id.toString())
        this.bot.sendMessage(
          msg.chat.id,
          `😌 You're now unsubscribed, just message me to subscribe again.`
        )
      }
    })
  }

  private sendLatestMessage = (latestXcodeRelease: any, id: string) => {
    const releaseType = latestXcodeRelease.version.release.beta
      ? `Beta ${latestXcodeRelease.version.release.beta}`
      : 'GM'
    this.bot.sendMessage(
      id,
      `🚀 A new ${latestXcodeRelease.name} version has been released: ${
        latestXcodeRelease.version.number
      }, build ${latestXcodeRelease.version.build}, ${releaseType}\nRelease notes:\n${
        latestXcodeRelease.links.notes.url
      }`
    )
  }

  private fetchLatestXcodeRelease = async () => {
    const result = await axios.get(releasesUrl)
    if (result.data && result.data.length > 0) {
      return result.data[0]
    }
    return null
  }

  private getAllSubscribers = async (): Promise<string[]> => {
    const subscribersResult = await this.pool.query('SELECT telegram_id FROM subscribers')
    return subscribersResult.rows.map(row => row.telegram_id)
  }

  private isSubscribed = async (id: string): Promise<boolean> => {
    const subscriberResult = await this.pool.query(
      `SELECT telegram_id FROM subscribers WHERE telegram_id = '${id}' LIMIT 1`
    )
    return subscriberResult.rowCount === 1
  }

  private getSubscriberCount = async (): Promise<number> => {
    const subscribersResult = await this.pool.query('SELECT COUNT(*) FROM subscribers')
    return subscribersResult.rows[0].count
  }

  private subscribe = async (id: string) => {
    await this.pool.query('INSERT INTO subscribers (telegram_id) VALUES ($1)', [id])
  }

  private unsubscribe = async (id: string) => {
    await this.pool.query(`DELETE FROM subscribers WHERE telegram_id = '${id}'`)
  }

  poll = async () => {
    const latestXcodeRelease = await this.fetchLatestXcodeRelease()
    if (!latestXcodeRelease) {
      return
    }

    const lastVersionRows = await this.pool.query(
      'SELECT id, build FROM xcode_versions ORDER BY id DESC LIMIT 1'
    )

    if (
      lastVersionRows.rowCount > 0 &&
      lastVersionRows.rows[0].build === latestXcodeRelease.version.build
    ) {
      return
    }

    const subscribersResult = await this.getAllSubscribers()
    subscribersResult.forEach(async subscriber => {
      this.sendLatestMessage(latestXcodeRelease, subscriber)
    })

    await this.pool.query('INSERT INTO xcode_versions (build) VALUES ($1)', [
      latestXcodeRelease.version.build.toString()
    ])
  }
}
