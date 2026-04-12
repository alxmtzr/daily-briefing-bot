import { DataSource } from "./interfaces/DataSource";
import { AIProvider } from "./interfaces/AIProvider";
import { Notifier } from "./interfaces/Notifier";

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
        private readonly notifier: Notifier
    ) {}

    async run(): Promise<void> {
        const results: string[] = [];

        for (const source of this.sources) {
            try {
                const data = await withRetry(() => source.fetchData());
                results.push(`[${source.name}]\n${data}`);
            } catch (error) {
                console.error(`Failed to fetch from "${source.name}" after retries:`, error);
                results.push(`[${source.name}]\nFailed to fetch data.`);
            }
        }

        const aggregated = results.join("\n\n");
        const summary = await this.aiProvider.summarize(aggregated);
        await this.notifier.notify(summary);
    }
}
