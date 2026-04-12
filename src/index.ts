import "dotenv/config";
import { EfaBwDepartureSource } from "./sources/EfaBwDepartureSource";
import { BUS_LINES_TOWARDS_HOME, BUS_LINES_TOWARDS_WORK } from "./common/constants";
import { Pipeline } from "./pipeline";

export const main = async (): Promise<void> => {
    console.log("Daily Briefing Bot started.");

    const sources = [
        new EfaBwDepartureSource("Towards work - Meersburger Brücke", process.env.TRANSPORT_STOP_1!, BUS_LINES_TOWARDS_WORK, "0715"),
        new EfaBwDepartureSource("Towards work (alternative stop) - Ravensburg Bahnhof", process.env.TRANSPORT_STOP_ALTERNATIVE!, BUS_LINES_TOWARDS_WORK, "0715"),
        new EfaBwDepartureSource("Towards home - Markdorf Gewerbegebiet", process.env.TRANSPORT_STOP_2!, BUS_LINES_TOWARDS_HOME, "1615"),
    ];

    // TODO: replace with real implementations once GeminiProvider and TelegramNotifier are built
    const aiProvider = { summarize: async (input: string) => input };
    const notifier = { notify: async (message: string) => { console.log("Briefing:\n", message); } };

    const pipeline = new Pipeline(sources, aiProvider, notifier);
    await pipeline.run();
};

// istanbul ignore next
if (require.main === module) {
    main();
}
