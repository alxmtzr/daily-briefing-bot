import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/pipeline", () => ({
    Pipeline: vi.fn().mockImplementation(function () { return { run: vi.fn().mockResolvedValue(undefined) }; }),
}));
vi.mock("../src/providers/gemini-provider", () => ({
    GeminiProvider: vi.fn().mockImplementation(function () { return {}; }),
}));
vi.mock("../src/notifiers/telegram-notifier", () => ({
    TelegramNotifier: vi.fn().mockImplementation(function () { return { notify: vi.fn() }; }),
}));
vi.mock("../src/config", () => ({
    config: { AI_ENABLED: false, NOTIFIER_ENABLED: false, LOG_API_RESPONSES: false, FORCE_COMMUTING_DAY: false },
}));

import { Pipeline } from "../src/pipeline";
import { runCommuteWeatherBriefing } from "../src/jobs/commute-weather-briefing";

const PipelineMock = vi.mocked(Pipeline);

function capturedSourceNames(): string[] {
    const sources = PipelineMock.mock.calls[0][0];
    return sources.map((s) => s.name);
}

describe("commute-weather-briefing", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Date.prototype, "getDay").mockReturnValue(3); // Wednesday = commuting day
    });

    afterEach(() => {
        delete process.env.RUN_LABEL;
        vi.restoreAllMocks();
    });

    describe("on a commuting day", () => {
        it("morning run includes work stops and weather, not home stop", async () => {
            process.env.RUN_LABEL = "Morning";
            await runCommuteWeatherBriefing();

            const names = capturedSourceNames();
            expect(names).toContain("Towards work - Meersburger Brücke");
            expect(names).toContain("Towards work (alternative stop) - Ravensburg Bahnhof");
            expect(names).not.toContain("Towards home - Markdorf Gewerbegebiet");
        });

        it("afternoon run includes home stop and weather, not work stops", async () => {
            process.env.RUN_LABEL = "Afternoon";
            await runCommuteWeatherBriefing();

            const names = capturedSourceNames();
            expect(names).toContain("Towards home - Markdorf Gewerbegebiet");
            expect(names).not.toContain("Towards work - Meersburger Brücke");
            expect(names).not.toContain("Towards work (alternative stop) - Ravensburg Bahnhof");
        });

        it("both runs include weather sources", async () => {
            for (const label of ["Morning", "Afternoon"]) {
                vi.clearAllMocks();
                process.env.RUN_LABEL = label;
                await runCommuteWeatherBriefing();

                const names = capturedSourceNames();
                expect(names).toContain("Ravensburg (Home)");
                expect(names).toContain("Markdorf (Work)");
            }
        });
    });

    describe("on a non-commuting day", () => {
        beforeEach(() => {
            vi.spyOn(Date.prototype, "getDay").mockReturnValue(1); // Monday
        });

        it("morning run includes only weather, no bus stops", async () => {
            process.env.RUN_LABEL = "Morning";
            await runCommuteWeatherBriefing();

            const names = capturedSourceNames();
            expect(names).not.toContain("Towards work - Meersburger Brücke");
            expect(names).not.toContain("Towards home - Markdorf Gewerbegebiet");
            expect(names).toContain("Ravensburg (Home)");
        });

        it("afternoon run includes only weather, no bus stops", async () => {
            process.env.RUN_LABEL = "Afternoon";
            await runCommuteWeatherBriefing();

            const names = capturedSourceNames();
            expect(names).not.toContain("Towards work - Meersburger Brücke");
            expect(names).not.toContain("Towards home - Markdorf Gewerbegebiet");
            expect(names).toContain("Ravensburg (Home)");
        });
    });
});
