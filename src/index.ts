import "dotenv/config";
import { runCommuteWeatherBriefing } from "./jobs/commute-weather-briefing";
import { runIndoorPoolChecker } from "./jobs/indoor-pool-checker";

export const main = async (): Promise<void> => {
    const job = process.env.JOB ?? "commute-weather-briefing";
    console.log(`Daily Briefing Bot started. Job: ${job}`);

    switch (job) {
        case "commute-weather-briefing":
            await runCommuteWeatherBriefing();
            break;
        case "indoor-pool-checker":
            await runIndoorPoolChecker();
            break;
        default:
            throw new Error(`Unknown job: "${job}". Valid jobs: commute-weather-briefing, indoor-pool-checker`);
    }
};

// istanbul ignore next
if (require.main === module) {
    main().catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
}
