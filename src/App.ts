import DotEnv from 'dotenv'
DotEnv.config()

import TelegramBot from 'node-telegram-bot-api'
import { CronJob } from 'cron'
import axios from 'axios'
import redis from 'redis'
import { Redis, Telegram, CronJob as CronJobConfig } from './Config'

const releasesUrl = 'https://xcodereleases.com/data.json'

const redisClient = redis.createClient({
  host: Redis.Host,
  port: Redis.Port,
  password: Redis.Password
})

const latestXcodeBuildKey = 'latestXcodeBuild'
const recipientIds = 'recipientIds'

class Fetcher {
  private bot = new TelegramBot(Telegram.BotToken, { polling: true })
  private cronJob: CronJob

  constructor() {
    this.cronJob = new CronJob(CronJobConfig.Schedule, async () => await this.poll())
    this.cronJob.start()

    this.bot.on('message', async msg => {
      redisClient.watch(recipientIds, err => {
        redisClient.get(recipientIds, (err, result) => {
          let ids: Array<any> = JSON.parse(result) || new Array()
          if (!ids.includes(msg.chat.id)) {
            ids.push(msg.chat.id)
            redisClient
              .multi()
              .set(recipientIds, JSON.stringify(ids))
              .exec((err, result) => {
                this.bot.sendMessage(
                  msg.chat.id,
                  `Hey there!\nYou'll get notified about the latest Xcode updates asap! 👍`
                )
              })
          }
        })
      })
      if (['/help', '/h', 'help'].includes(msg.text || '')) {
        this.bot.sendMessage(
          msg.chat.id,
          `Available commands:\n/latest -> Responds with latest available Xcode release.`
        )
      } else if (msg.text === '/latest') {
        const latestXcodeRelease = await this.fetchLatestXcodeRelease()
        if (latestXcodeRelease) {
          this.sendLatestMessage(latestXcodeRelease, msg.chat.id)
        }
      } else if (msg.text === '/users') {
        redisClient.get(recipientIds, (err, result) => {
          const ids = JSON.parse(result) || []
          this.bot.sendMessage(msg.chat.id, `Currently ${ids.length} people are using this bot. 🎉`)
        })
      }
    })
  }

  private sendLatestMessage = (latestXcodeRelease: any, id: number) => {
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

  poll = async () => {
    const latestXcodeRelease = await this.fetchLatestXcodeRelease()
    if (!latestXcodeRelease) {
      return
    }
    redisClient.watch(err => {
      redisClient.get(latestXcodeBuildKey, (err, build) => {
        if (build === latestXcodeRelease.version.build) {
          return
        }
        redisClient.get(recipientIds, (err, ids) => {
          const idsArray = JSON.parse(ids) || []
          const sentIds = new Array()
          for (let i = 0; i < idsArray.length; i++) {
            const id = idsArray[i]
            if (sentIds.indexOf(id) === -1) {
              this.sendLatestMessage(latestXcodeRelease, id)
              sentIds.push(id)
            }
          }
          redisClient.set(latestXcodeBuildKey, latestXcodeRelease.version.build.toString())
        })
      })
    })
  }
}

const fetcher = new Fetcher()
fetcher.poll()
