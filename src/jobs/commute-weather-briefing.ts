import "dotenv/config";
import { EfaBwDepartureSource } from "../sources/efa-bw-departure-source";
import { BUS_LINES_TOWARDS_HOME, BUS_LINES_TOWARDS_WORK, LOCATION_HOME, LOCATION_WORK, STOP_IDS, STOP_NAMES, SYSTEM_PROMPT } from "../common/constants";
import { Pipeline } from "../pipeline";
import { WeatherDataSource } from "../sources/weather-data-source";
import { GeminiProvider } from "../providers/gemini-provider";
import { TelegramNotifier } from "../notifiers/telegram-notifier";
import { config } from "../config";

export const runCommuteWeatherBriefing = async (): Promise<void> => {
    console.log("Job: commute-weather-briefing started.");

    const today = new Date().getDay(); // 0=Sun, 1=Mon, 2=Tue, ..., 6=Sat
    const isCommutingDay = config.FORCE_COMMUTING_DAY || (today >= 2 && today <= 4); // Tue–Thu
    console.log(`Day: ${today} | Commuting day: ${isCommutingDay}${config.FORCE_COMMUTING_DAY ? " (forced)" : ""}`);

    const sources = [
        ...(isCommutingDay ? [
            new EfaBwDepartureSource(STOP_NAMES.TOWARDS_WORK_PRIMARY, STOP_IDS.TOWARDS_WORK_PRIMARY, BUS_LINES_TOWARDS_WORK, "0715"),
            new EfaBwDepartureSource(STOP_NAMES.TOWARDS_WORK_ALTERNATIVE, STOP_IDS.TOWARDS_WORK_ALTERNATIVE, BUS_LINES_TOWARDS_WORK, "0715"),
            new EfaBwDepartureSource(STOP_NAMES.TOWARDS_HOME, STOP_IDS.TOWARDS_HOME, BUS_LINES_TOWARDS_HOME, "1615"),
        ] : []),
        new WeatherDataSource(LOCATION_HOME.name, LOCATION_HOME.lat, LOCATION_HOME.lon),
        new WeatherDataSource(LOCATION_WORK.name, LOCATION_WORK.lat, LOCATION_WORK.lon),
    ];

    const aiProvider = config.AI_ENABLED
        ? new GeminiProvider()
        : { summarize: async (data: string) => data };
    const notifier = config.NOTIFIER_ENABLED
        ? new TelegramNotifier()
        : { notify: async (_message: string) => {} };

    const runLabel = process.env.RUN_LABEL ?? "Unknown";
    const pipeline = new Pipeline(sources, aiProvider, notifier, SYSTEM_PROMPT, runLabel, config);

    try {
        await pipeline.run();
    } catch (error) {
        console.error("Pipeline failed:", error);
        if (config.NOTIFIER_ENABLED) {
            const errorNotifier = new TelegramNotifier();
            await errorNotifier.notify(`⚠️ <b>Briefing failed</b>\nThe ${runLabel} briefing could not be delivered. Please check the logs.`);
        }
        throw error;
    }
};
