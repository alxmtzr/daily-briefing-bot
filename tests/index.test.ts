import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { main } from "../src/index";

vi.mock("../src/jobs/commute-weather-briefing", () => ({
    runCommuteWeatherBriefing: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/jobs/indoor-pool-checker", () => ({
    runIndoorPoolChecker: vi.fn().mockResolvedValue(undefined),
}));

import { runCommuteWeatherBriefing } from "../src/jobs/commute-weather-briefing";
import { runIndoorPoolChecker } from "../src/jobs/indoor-pool-checker";

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
        expect(runIndoorPoolChecker).not.toHaveBeenCalled();
    });

    it("runs commute-weather-briefing when JOB=commute-weather-briefing", async () => {
        process.env.JOB = "commute-weather-briefing";
        await main();
        expect(runCommuteWeatherBriefing).toHaveBeenCalledOnce();
    });

    it("runs indoor-pool-checker when JOB=indoor-pool-checker", async () => {
        process.env.JOB = "indoor-pool-checker";
        await main();
        expect(runIndoorPoolChecker).toHaveBeenCalledOnce();
        expect(runCommuteWeatherBriefing).not.toHaveBeenCalled();
    });

    it("throws for an unknown JOB value", async () => {
        process.env.JOB = "unknown-job";
        await expect(main()).rejects.toThrow('Unknown job: "unknown-job"');
    });
});
