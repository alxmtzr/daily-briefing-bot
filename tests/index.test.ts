import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { main } from "../src/index";

vi.mock("../src/jobs/commute-weather-briefing", () => ({
    runCommuteWeatherBriefing: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/jobs/hallenbad-checker", () => ({
    runHallenbadChecker: vi.fn().mockResolvedValue(undefined),
}));

import { runCommuteWeatherBriefing } from "../src/jobs/commute-weather-briefing";
import { runHallenbadChecker } from "../src/jobs/hallenbad-checker";

describe("main dispatcher", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        delete process.env.JOB;
    });

    it("defaults to commute-weather-briefing when JOB is not set", async () => {
        delete process.env.JOB;
        await main();
        expect(runCommuteWeatherBriefing).toHaveBeenCalledOnce();
        expect(runHallenbadChecker).not.toHaveBeenCalled();
    });

    it("runs commute-weather-briefing when JOB=commute-weather-briefing", async () => {
        process.env.JOB = "commute-weather-briefing";
        await main();
        expect(runCommuteWeatherBriefing).toHaveBeenCalledOnce();
    });

    it("runs hallenbad-checker when JOB=hallenbad-checker", async () => {
        process.env.JOB = "hallenbad-checker";
        await main();
        expect(runHallenbadChecker).toHaveBeenCalledOnce();
        expect(runCommuteWeatherBriefing).not.toHaveBeenCalled();
    });

    it("throws for an unknown JOB value", async () => {
        process.env.JOB = "unknown-job";
        await expect(main()).rejects.toThrow('Unknown job: "unknown-job"');
    });
});
