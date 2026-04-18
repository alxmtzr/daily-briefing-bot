import { DataSource } from "./interfaces/data-source";
import { AIProvider } from "./interfaces/ai-provider";
import { Notifier } from "./interfaces/notifier";
import { Config } from "./config";

async function withRetry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return withRetry(fn, retries - 1, delayMs * 2);
    }
}

export class Pipeline {
    constructor(
        private readonly sources: DataSource[],
        private readonly aiProvider: AIProvider,
        private readonly notifier: Notifier,
        private readonly systemPrompt: string,
        private readonly runLabel: string,
        private readonly config: Config
    ) {}

    async run(): Promise<void> {
        const results: string[] = [];

        for (const source of this.sources) {
            try {
                const data = await withRetry(() => source.fetchData());
                if (this.config.LOG_API_RESPONSES) {
                    console.log(`[${source.name}] raw response:\n${data}`);
                }
                results.push(`[${source.name}]\n${data}`);
            } catch (error) {
                console.error(`Failed to fetch from "${source.name}" after retries:`, error);
                results.push(`[${source.name}]\nFailed to fetch data.`);
            }
        }

        const aggregated = `Run: ${this.runLabel}\n\n` + results.join("\n\n");
        const summary = await withRetry(() => this.aiProvider.summarize(aggregated, this.systemPrompt));
        const date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        const header = `📋 <b>${this.runLabel} Briefing — ${date}</b>\n\n`;
        const finalMessage = header + summary;
        console.log("Briefing:\n", finalMessage);
        await this.notifier.notify(finalMessage);
    }
}
