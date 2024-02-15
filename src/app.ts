import DotEnv from 'dotenv'
DotEnv.config()

import TelegramBot from 'node-telegram-bot-api'
import { CronJob } from 'cron'
import axios from 'axios'
import { Pool } from 'pg'
import moment from 'moment'

const releasesUrl = 'https://xcodereleases.com/data.json'

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true })
const cronJob = new CronJob(
  process.env.CRONJOB_SCHEDULE || '0 */5 * * * *',
  async () => await poll()
)
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    `postgres://postgres:${process.env.POSTGRES_PASSWORD}@database:5432/postgres`,
})

bot.on('message', async (msg) => {
  if (!(await isSubscribed(msg.chat.id.toString()))) {
    await subscribe(msg.chat.id.toString())
    bot.sendMessage(
      msg.chat.id,
      `Hey there!\nYou'll get notified about the latest Xcode releases asap! 👍`
    )
  }

  if (['/help', '/h', 'help'].includes(msg.text || '')) {
    bot.sendMessage(
      msg.chat.id,
      `Available commands:\n
      /latest -> Responds with latest available Xcode release.\n
      /unsubscribe -> Don't get new Xcode release notifications.\n
      /users -> Returns the current number of subscribers of this bot.`
    )
  } else if (msg.text === '/latest') {
    const latestXcodeRelease = await fetchLatestXcodeRelease()
    if (latestXcodeRelease) {
      sendLatestMessage(latestXcodeRelease, msg.chat.id.toString())
    }
  } else if (msg.text === '/users') {
    bot.sendMessage(
      msg.chat.id,
      `Currently ${await getSubscriberCount()} people are subscribed to this bot. 🎉`
    )
  } else if (msg.text === '/unsubscribe') {
    await unsubscribe(msg.chat.id.toString())
    bot.sendMessage(msg.chat.id, `😌 You're now unsubscribed, just message me to subscribe again.`)
  }
})

const sendLatestMessage = (latestXcodeRelease: any, id: string) => {
  const releaseType = (): string => {
    if (latestXcodeRelease.version.release.beta) {
      return `Beta ${latestXcodeRelease.version.release.beta}`
    }
    if (latestXcodeRelease.version.release.dp) {
      return `Developer Preview ${latestXcodeRelease.version.release.dp}`
    }
    if (latestXcodeRelease.version.release.gm) {
      return 'GM'
    }
    if (latestXcodeRelease.version.release.gmSeed) {
      return `GM Seed ${latestXcodeRelease.version.release.gmSeed}`
    }
    if (latestXcodeRelease.version.release.rc) {
      return `RC ${latestXcodeRelease.version.release.rc}`
    }
    return ''
  }
  try {
    bot.sendMessage(
      id,
      `🚀 A new ${latestXcodeRelease.name} version has been released: ${
        latestXcodeRelease.version.number
      }, build ${latestXcodeRelease.version.build}, ${releaseType()}${getReleaseNotes(
        latestXcodeRelease
      )}`
    )
  } catch (error) {
    console.log(`Could not send Xcode Release message to user: ${error}`)
  }
}

const getReleaseNotes = (latestXcodeRelease: any): string => {
  if (latestXcodeRelease.links.notes === undefined) {
    return ''
  }
  return `\nRelease notes:\n${latestXcodeRelease.links.notes.url}`
}

const fetchLatestXcodeRelease = async () => {
  const result = await axios.get(releasesUrl)
  if (result.data && result.data.length > 0) {
    const sortedResult = result.data
      .map((item: any) => {
        item._moment = moment(item.date)
        return item
      })
      .sort((a: any, b: any) => b._moment - a._moment)
    return sortedResult[0]
  }
  return null
}

const getAllSubscribers = async (): Promise<string[]> => {
  const subscribersResult = await pool.query('SELECT telegram_id FROM subscribers')
  return subscribersResult.rows.map((row) => row.telegram_id)
}

const isSubscribed = async (id: string): Promise<boolean> => {
  const subscriberResult = await pool.query(
    `SELECT telegram_id FROM subscribers WHERE telegram_id = '${id}' LIMIT 1`
  )
  return subscriberResult.rowCount === 1
}

const getSubscriberCount = async (): Promise<number> => {
  const subscribersResult = await pool.query('SELECT COUNT(*) FROM subscribers')
  return subscribersResult.rows[0].count
}

const subscribe = async (id: string) => {
  await pool.query('INSERT INTO subscribers (telegram_id, added_at) VALUES ($1, $2)', [
    id,
    new Date(),
  ])
  console.log(`Subscriber has been added: ${id}`)
}

const unsubscribe = async (id: string) => {
  await pool.query(`DELETE FROM subscribers WHERE telegram_id = '${id}'`)
  console.log(`Subscriber has been removed: ${id}`)
}

const poll = async () => {
  console.log('Polling for new Xcode releases…')

  const latestXcodeRelease = await fetchLatestXcodeRelease()
  if (!latestXcodeRelease) {
    console.log('No Xcode release found @ xcodereleases.com, bailing out.')
    return
  }

  const lastVersionRows = await pool.query(
    'SELECT id, build FROM xcode_versions ORDER BY id DESC LIMIT 1'
  )

  if (
    lastVersionRows.rowCount != null &&
    lastVersionRows.rowCount > 0 &&
    lastVersionRows.rows[0].build === latestXcodeRelease.version.build
  ) {
    console.log(
      `Latest Xcode release (${lastVersionRows.rows[0].build}) has already been propagated.`
    )
    return
  }

  await pool.query('INSERT INTO xcode_versions (build, added_at) VALUES ($1, $2)', [
    latestXcodeRelease.version.build.toString(),
    new Date(),
  ])

  const subscribersResult = await getAllSubscribers()
  subscribersResult.forEach(async (subscriber) => {
    console.log(`Sending new Xcode release message to ${subscriber}`)
    sendLatestMessage(latestXcodeRelease, subscriber)
  })

  console.log(
    `Added Xcode release (${latestXcodeRelease.version.build.toString()}) to known versions.`
  )
}

;(async () => {
  await poll()
})()

cronJob.start()
