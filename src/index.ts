import "dotenv/config";
import { EfaBwDepartureSource } from "./sources/efa-bw-departure-source";
import { BUS_LINES_TOWARDS_HOME, BUS_LINES_TOWARDS_WORK, LOCATION_HOME, LOCATION_WORK, STOP_NAMES } from "./common/constants";
import { Pipeline } from "./pipeline";
import { WeatherDataSource } from "./sources/weather-data-source";

export const main = async (): Promise<void> => {
    console.log("Daily Briefing Bot started.");

    const sources = [
        new EfaBwDepartureSource(STOP_NAMES.TOWARDS_WORK_PRIMARY, process.env.TRANSPORT_STOP_1!, BUS_LINES_TOWARDS_WORK, "0715"),
        new EfaBwDepartureSource(STOP_NAMES.TOWARDS_WORK_ALTERNATIVE, process.env.TRANSPORT_STOP_ALTERNATIVE!, BUS_LINES_TOWARDS_WORK, "0715"),
        new EfaBwDepartureSource(STOP_NAMES.TOWARDS_HOME, process.env.TRANSPORT_STOP_2!, BUS_LINES_TOWARDS_HOME, "1615"),
        new WeatherDataSource(LOCATION_HOME.name, LOCATION_HOME.lat, LOCATION_HOME.lon),
        new WeatherDataSource(LOCATION_WORK.name, LOCATION_WORK.lat, LOCATION_WORK.lon),
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
