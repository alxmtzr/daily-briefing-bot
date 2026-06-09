import { HallenbadSource } from "../sources/hallenbad-source";
import { Pipeline } from "../pipeline";
import { TelegramNotifier } from "../notifiers/telegram-notifier";
import { config } from "../config";

export const runIndoorPoolChecker = async (): Promise<void> => {
    console.log("Job: indoor-pool-checker started.");

    const sources = [new HallenbadSource()];

    const aiProvider = { summarize: async (data: string) => data };
    const notifier = config.NOTIFIER_ENABLED
        ? new TelegramNotifier()
        : { notify: async (_message: string) => {} };

    const runLabel = "Indoor Pool";
    const pipeline = new Pipeline(sources, aiProvider, notifier, "", runLabel, config);

    await pipeline.run();
};
