<p align="center">
  <img src="assets/daily-briefing-bot.png" alt="Daily Briefing Bot Logo" width="180" />
</p>

<h1 align="center">Daily Briefing Bot</h1>

<p align="center">
  A personal automation bot that delivers daily briefings via Telegram.<br />
  Collects public transport departures, weather forecasts, and more — summarizes with Google Gemini,<br />
  and sends concise messages. Runs fully automated on a VPS via Docker and cron.
</p>

<p align="center">
  <img src="assets/telegram-bot-message.jpg" alt="Telegram mobile" height="420" />
  <br /><br />
  <sub>Briefing message on mobile</sub>
</p>


## Table of Contents

- [Jobs](#jobs)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started Locally](#getting-started-locally)
- [VPS Deployment](#vps-deployment)
- [Extending the Bot](#extending-the-bot)
  - [Adding a Job](#adding-a-job)
  - [Adding a Data Source](#adding-a-data-source)
  - [Adding a Notifier](#adding-a-notifier)
  - [Swapping the AI Provider](#swapping-the-ai-provider)
- [Tech Stack](#tech-stack)



## Jobs

The bot supports multiple independent jobs, selected via the `JOB` environment variable:

| Job | Description | AI | Notifier |
|---|---|---|---|
| `commute-weather-briefing` | Bus departures + weather forecast, summarized by Gemini | ✅ | Telegram |
| `indoor-pool-checker` | Scrapes indoor pool opening status | ❌ | Telegram |

Each job runs in its own Docker container with isolated environment variables (separate Telegram bots, credentials, etc.).



## Architecture

```
cron (VPS)
    │
    ├── docker compose run --rm commute-weather-briefing
    │         │
    │         ▼
    │   Data Sources (fetch in parallel)
    │   ├── EFA-BW departure monitor (bus lines)
    │   └── Open-Meteo weather API
    │         │
    │         ▼
    │   Pipeline → Gemini AI → Telegram
    │
    └── docker compose run --rm indoor-pool-checker
              │
              ▼
        Data Sources
        └── Hallenbad Ravensburg scraper
              │
              ▼
        Pipeline → Telegram (no AI)
```

All external systems are abstracted behind interfaces (`DataSource`, `AIProvider`, `Notifier`), making it straightforward to swap or add implementations without touching the core pipeline.



## Project Structure

```
src/
├── common/
│   └── constants.ts                   # Stop IDs, bus lines, locations, system prompt path
├── interfaces/
│   ├── data-source.ts                 # DataSource interface
│   ├── ai-provider.ts                 # AIProvider interface
│   └── notifier.ts                    # Notifier interface
├── sources/
│   ├── efa-bw-departure-source.ts     # Public transport (EFA-BW API)
│   ├── weather-data-source.ts         # Weather (Open-Meteo API)
│   ├── hallenbad-source.ts            # Indoor pool status scraper
│   └── web-scraper-source.ts          # Generic HTML scraper (Cheerio)
├── providers/
│   └── gemini-provider.ts             # Google Gemini AI summarization
├── notifiers/
│   └── telegram-notifier.ts           # Telegram Bot API
├── resources/
│   └── system-prompt.txt             # AI system prompt
├── jobs/
│   ├── commute-weather-briefing.ts    # Job: commute + weather briefing
│   └── indoor-pool-checker.ts        # Job: indoor pool status
├── config.ts                         # Feature flags from environment variables
├── pipeline.ts                       # Core orchestration (fetch → summarize → notify)
└── index.ts                          # Entry point — routes JOB env var to job
tests/
├── integration/                      # Real HTTP calls (run nightly)
└── *.test.ts                         # Unit tests (mocked)
.github/workflows/
├── ci.yml                            # Tests + coverage on push/PR
├── deploy.yml                        # Auto-deploy to VPS on push to main
└── integration.yml                   # Nightly integration tests
docker-compose.yml                    # Two services, one per job
Dockerfile                            # Multi-stage build: compile TS → production image
```



## Getting Started Locally

### Prerequisites

- Node.js (version from `.nvmrc`)
- A Telegram Bot token and chat ID (see [Telegram Setup](#telegram-setup) below)
- A Google AI Studio API key (see [Gemini Setup](#gemini-api-key) below)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Which job to run
JOB=commute-weather-briefing

# AI provider (only needed for commute-weather-briefing)
AI_API_KEY=your_gemini_api_key

# Telegram notifier
NOTIFIER_BOT_TOKEN=your_telegram_bot_token
NOTIFIER_CHAT_ID=your_telegram_chat_id

# Dev / testing flags
AI_ENABLED=true               # set to false to skip Gemini and print raw data instead
NOTIFIER_ENABLED=true         # set to false to print briefing to stdout instead of Telegram
LOG_API_RESPONSES=false       # set to true to print each source's raw response to stdout
FORCE_COMMUTING_DAY=false     # set to true to force bus data even on non-commuting days
```

**Tips for local development:**
- Set `AI_ENABLED=false` and `NOTIFIER_ENABLED=false` to run fully offline — useful for testing new data sources
- Set `FORCE_COMMUTING_DAY=true` to always include bus departures regardless of the day

### 3. Run

```bash
# Run with ts-node (no build step needed)
npm run dev

# Or build first, then run
npm run build
npm start
```

To run the indoor pool checker instead:

```bash
# change JOB= in your .env, then:
npm run dev
```

### 4. Run tests

```bash
npm test                  # unit tests
npm run test:coverage     # unit tests with coverage report
npm run test:integration  # integration tests (makes real HTTP calls)
```

---

### Telegram Setup

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts to name your bot
3. BotFather will give you a **bot token** — copy it to `NOTIFIER_BOT_TOKEN`
4. Start a conversation with your new bot (send any message)
5. Open this URL in your browser to find your **chat ID**:
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

---

## VPS Deployment

The bot runs on a VPS using Docker and cron. GitHub Actions automatically deploys on every push to `main`.

### How it works

1. Push to `main` triggers `deploy.yml`
2. GitHub Actions SSHes into the VPS, runs `git pull && docker compose build`
3. Cron jobs on the VPS trigger `docker compose run --rm <job>` on schedule
4. Each job runs in a short-lived container, sends its message, and exits

### Required GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `VPS_HOST` | VPS IPv4 address |
| `VPS_USER` | SSH username |
| `VPS_SSH_KEY` | SSH private key |
| `VPS_SSH_PORT` | SSH port |

### VPS Setup

1. Clone the repo on the VPS:
   ```bash
   git clone https://github.com/<your-user>/daily-briefing-bot /opt/daily-briefing-bot
   ```

2. Create `/opt/daily-briefing-bot/.env` with your credentials:
   ```env
   COMMUTE_AI_API_KEY=...
   COMMUTE_NOTIFIER_BOT_TOKEN=...
   COMMUTE_NOTIFIER_CHAT_ID=...
   INDOOR_POOL_NOTIFIER_BOT_TOKEN=...
   INDOOR_POOL_NOTIFIER_CHAT_ID=...
   ```

3. Add cron jobs (`crontab -e`):
   ```
   # Commute + weather — daily at 7am (bus only on Tue–Thu automatically)
   0 7 * * * cd /opt/daily-briefing-bot && docker compose run --rm commute-weather-briefing

   # Commute + weather — afternoon on Tue–Thu at 4pm
   0 16 * * 2-4 cd /opt/daily-briefing-bot && docker compose run --rm commute-weather-briefing

   # Indoor pool — Mon–Fri at 12pm
   0 12 * * 1-5 cd /opt/daily-briefing-bot && docker compose run --rm indoor-pool-checker

   # Indoor pool — Sat–Sun at 9am
   0 9 * * 6,0 cd /opt/daily-briefing-bot && docker compose run --rm indoor-pool-checker
   ```

4. Fix git safe directory (needed when SSH user differs from repo owner):
   ```bash
   git config --global --add safe.directory /opt/daily-briefing-bot
   ```

---

## Extending the Bot

### Adding a Job

1. Create `src/jobs/my-job.ts` and export a `runMyJob()` function
2. Register it in `src/index.ts` with a new `case` in the switch
3. Add a new service in `docker-compose.yml` with `JOB: my-job`

### Adding a Data Source

Any class that implements `DataSource` can be added to the pipeline:

```ts
export interface DataSource {
    name: string;
    fetchData(): Promise<string>;
}
```

`fetchData()` must return a plain text string. The pipeline aggregates all source outputs and passes them to the AI provider.

**Example — a public holiday check:**

```ts
// src/sources/public-holiday-source.ts
import axios from "axios";
import { DataSource } from "../interfaces/data-source";

export class PublicHolidaySource implements DataSource {
    name = "Public Holidays";

    async fetchData(): Promise<string> {
        const year = new Date().getFullYear();
        const response = await axios.get(
            `https://date.nager.at/api/v3/PublicHolidays/${year}/DE`,
            { timeout: 10000 }
        );
        const today = new Date().toISOString().slice(0, 10);
        const holiday = response.data.find((h: { date: string; name: string }) => h.date === today);
        return holiday
            ? `Today is a public holiday: ${holiday.name}`
            : "No public holiday today.";
    }
}
```

---

### Adding a Notifier

Any class that implements `Notifier` can replace or run alongside Telegram:

```ts
export interface Notifier {
    notify(message: string): Promise<void>;
}
```

**Example — a Discord webhook notifier:**

```ts
// src/notifiers/discord-notifier.ts
import axios from "axios";
import { Notifier } from "../interfaces/notifier";

export class DiscordNotifier implements Notifier {
    private readonly webhookUrl: string;

    constructor() {
        const url = process.env.DISCORD_WEBHOOK_URL;
        if (!url) throw new Error("DISCORD_WEBHOOK_URL is not set");
        this.webhookUrl = url;
    }

    async notify(message: string): Promise<void> {
        const plain = message.replace(/<[^>]+>/g, "");
        await axios.post(this.webhookUrl, { content: plain }, { timeout: 10000 });
    }
}
```

---

### Swapping the AI Provider

Any class that implements `AIProvider` can replace Gemini:

```ts
export interface AIProvider {
    summarize(input: string, systemPrompt: string): Promise<string>;
}
```

**Example — an OpenAI provider:**

```ts
// src/providers/openai-provider.ts
import OpenAI from "openai";
import { AIProvider } from "../interfaces/ai-provider";

export class OpenAIProvider implements AIProvider {
    private readonly client: OpenAI;

    constructor() {
        this.client = new OpenAI({ apiKey: process.env.AI_API_KEY });
    }

    async summarize(input: string, systemPrompt: string): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: input },
            ],
        });
        return response.choices[0].message.content ?? "";
    }
}
```

---

## Tech Stack

- **TypeScript** + Node.js
- **Docker** + Docker Compose — containerized execution, one container per job
- **Vitest** — unit and integration tests
- **Axios** — HTTP client (10s timeout on all calls, with automatic retry)
- **Cheerio** — HTML parsing for the web scraper source
- **Google Gemini API** — AI summarization
- **Telegram Bot API** — delivery channel
- **Open-Meteo API** — weather data (no API key required)
- **EFA-BW API** — public transport departures (Baden-Württemberg)
- **GitHub Actions** — CI, deploy on push to main
