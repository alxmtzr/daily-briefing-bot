import { it, describe, expect } from "vitest";
import { EfaBwDepartureSource } from "../../src/sources/efa-bw-departure-source";
import { BUS_LINES_TOWARDS_WORK, BUS_LINES_TOWARDS_HOME, STOP_IDS, STOP_NAMES } from "../../src/common/constants";

describe("EfaBwDepartureSource — Integration", () => {
    it("fetches data for primary work stop", async () => {
        const source = new EfaBwDepartureSource(
            STOP_NAMES.TOWARDS_WORK_PRIMARY,
            STOP_IDS.TOWARDS_WORK_PRIMARY,
            BUS_LINES_TOWARDS_WORK,
            "0800"
        );

        const result = await source.fetchData();

        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
    }, 15000);

    it("fetches data for alternative work stop", async () => {
        const source = new EfaBwDepartureSource(
            STOP_NAMES.TOWARDS_WORK_ALTERNATIVE,
            STOP_IDS.TOWARDS_WORK_ALTERNATIVE,
            BUS_LINES_TOWARDS_WORK,
            "0800"
        );

        const result = await source.fetchData();

        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
    }, 15000);

    it("fetches data for home stop", async () => {
        const source = new EfaBwDepartureSource(
            STOP_NAMES.TOWARDS_HOME,
            STOP_IDS.TOWARDS_HOME,
            BUS_LINES_TOWARDS_HOME,
            "1600"
        );

        const result = await source.fetchData();

        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
    }, 15000);
});
