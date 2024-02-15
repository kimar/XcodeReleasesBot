import DotEnv from 'dotenv'
DotEnv.config()

import express, { Request, Response } from 'express'
import { Fetcher } from './fetcher'
import { Telegram } from './config1'

const app = express()

const fetcher = new Fetcher()
fetcher.poll()

app.get('/', (_req: Request, res: Response) => res.redirect(Telegram.BotUrl))
app.listen(process.env.PORT || 3000)
