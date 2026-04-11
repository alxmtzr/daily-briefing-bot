# daily-briefing-bot
Automates daily tasks by collecting data from multiple sources, summarizing it with AI, and sending updates via Telegram.

## Project Structure

```
src/
├── interfaces/          # Interface definitions (DataSource, AIProvider, Notifier, Storage)
├── sources/             # DataSource implementations (web scraping, transport API, weather API...)
├── providers/           # AIProvider implementations (Gemini, OpenAI...)
├── notifiers/           # Notifier implementations (Telegram, email...)
├── pipeline.ts          # Orchestrates the full flow: fetch → summarize → send
└── index.ts             # Entrypoint, wires implementations together and runs the pipeline
```

## Setup

### Prerequisites

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts to name your bot
3. BotFather will give you a **bot token** — copy it to `NOTIFIER_BOT_TOKEN`
4. Start a conversation with your new bot (send any message)
5. Open the following URL in your browser to find your **chat ID**:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   Look for `"chat": { "id": ... }` in the response — copy that number to `NOTIFIER_CHAT_ID`

### Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API key** → **Create API key**
4. Copy the key to `AI_API_KEY`

The free tier is sufficient for this project.
