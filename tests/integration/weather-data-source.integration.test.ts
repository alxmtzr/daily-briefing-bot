import { it, describe, expect, TestContext } from "vitest";
import axios from "axios";
import { WeatherDataSource } from "../../src/sources/weather-data-source";
import { LOCATION_HOME, LOCATION_WORK } from "../../src/common/constants";

const skipWhenExternalWeatherApiUnavailable = (error: unknown, context: TestContext) => {
    if (!axios.isAxiosError(error)) {
        throw error;
    }

    const statusCode = error.response?.status;
    if (statusCode && statusCode >= 500) {
        context.skip(`Open-Meteo unavailable (HTTP ${statusCode})`);
        return;
    }

    const networkCodes = ["ENOTFOUND", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"];
    if (error.code && networkCodes.includes(error.code)) {
        context.skip(`Open-Meteo unavailable (${error.code})`);
        return;
    }

    throw error;
};

describe("WeatherDataSource — Integration", () => {
    it("fetches weather for home location", async (context) => {
        const source = new WeatherDataSource(LOCATION_HOME.name, LOCATION_HOME.lat, LOCATION_HOME.lon);

        try {
            const result = await source.fetchData();

            expect(result).toContain("Weather at Ravensburg (Home)");
            expect(result).toContain("Current:");
            expect(result).toContain("Today:");
        } catch (error) {
            skipWhenExternalWeatherApiUnavailable(error, context);
        }
    }, 15000);

    it("fetches weather for work location", async (context) => {
        const source = new WeatherDataSource(LOCATION_WORK.name, LOCATION_WORK.lat, LOCATION_WORK.lon);

        try {
            const result = await source.fetchData();

            expect(result).toContain("Weather at Markdorf (Work)");
            expect(result).toContain("Current:");
            expect(result).toContain("Today:");
        } catch (error) {
            skipWhenExternalWeatherApiUnavailable(error, context);
        }
    }, 15000);
});
