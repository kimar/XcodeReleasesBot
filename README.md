# Xcode Releases Telegram Bot
## Fetching data from https://xcodereleases.com/data.json

### 📝 Subscribe via Telegram

[https://t.me/XcodeReleasesBot](https://t.me/XcodeReleasesBot)

### 🛠 Requirements

* Yarn
* NodeJS
* PostgreSQL
* Somewhere to host this e.g. [Heroku](https://heroku.com)

### 🏗 Get started

Set up the required environment variables `DATABASE_URL` and `TELEGRAM_BOT_TOKEN`, either by using a `.env` file in this repo's folder for local development, or by specifing them in your runtime environment.

`DATABASE_URL` should be the postgres uri to your Database
`TELEGRAM_BOT_TOKEN` should be a valid bot token to the Telegram Bot

```
$ yarn
$ yarn dev
```

### 🤖 Available commands

`/latest` -> Sends you information about the most current Xcode build available via Xcodereleases.com

`/unsubscribe` -> Unsubscribes you from the list of recipients of new Xcode builds

`/users` -> Show the number of current users of this bot

### [LICENSE](LICENSE.md)
