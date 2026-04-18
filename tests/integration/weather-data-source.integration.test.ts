import { it, describe, expect } from "vitest";
import { WeatherDataSource } from "../../src/sources/weather-data-source";
import { LOCATION_HOME, LOCATION_WORK } from "../../src/common/constants";

describe("WeatherDataSource — Integration", () => {
    it("fetches weather for home location", async () => {
        const source = new WeatherDataSource(LOCATION_HOME.name, LOCATION_HOME.lat, LOCATION_HOME.lon);

        const result = await source.fetchData();

        expect(result).toContain("Weather at Ravensburg (Home)");
        expect(result).toContain("Current:");
        expect(result).toContain("Today:");
    }, 15000);

    it("fetches weather for work location", async () => {
        const source = new WeatherDataSource(LOCATION_WORK.name, LOCATION_WORK.lat, LOCATION_WORK.lon);

        const result = await source.fetchData();

        expect(result).toContain("Weather at Markdorf (Work)");
        expect(result).toContain("Current:");
        expect(result).toContain("Today:");
    }, 15000);
});
