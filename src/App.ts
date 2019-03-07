import TelegramBot from 'node-telegram-bot-api'
import { CronJob } from 'cron'
import axios from 'axios'

const releasesUrl =
  'https://raw.githubusercontent.com/xcodereleases/xcodereleases.com/master/_data/releases.json'

const telegramBotToken = ''
const cronJobSchedule = '0 */1 * * *'

class Fetcher {
  private bot = new TelegramBot(telegramBotToken, { polling: true })
  private cronJob: CronJob

  constructor() {
    this.cronJob = new CronJob(cronJobSchedule, async () => await this.poll())
    this.cronJob.start()
  }

  poll = async () => {
    const result = await axios.get(releasesUrl)
    if (result.data) {
      console.log(result.data[0])
    }
  }
}

const fetcher = new Fetcher()
fetcher.poll()
