import { describe, it, expect, vi } from "vitest";
import { Pipeline } from "../src/pipeline";
import { DataSource } from "../src/interfaces/data-source";
import { AIProvider } from "../src/interfaces/ai-provider";
import { Notifier } from "../src/interfaces/notifier";
import { Config } from "../src/config";

vi.useFakeTimers();

const defaultConfig: Config = { AI_ENABLED: true, NOTIFIER_ENABLED: true, LOG_API_RESPONSES: false, FORCE_COMMUTING_DAY: false };

const makeSource = (name: string, data: string): DataSource => ({
    name,
    fetchData: vi.fn().mockResolvedValue(data),
});

const makeAiProvider = (summary: string = "AI summary"): AIProvider => ({
    summarize: vi.fn().mockResolvedValue(summary),
});

const makeNotifier = (): Notifier => ({
    notify: vi.fn().mockResolvedValue(undefined),
});

describe("Pipeline", () => {
    it("fetches all sources, summarizes, and notifies", async () => {
        vi.setSystemTime(new Date("2026-04-18"));
        const source1 = makeSource("Transport", "Line 700 on time");
        const source2 = makeSource("Weather", "Sunny, 18°C");
        const ai = makeAiProvider("Everything looks good today.");
        const notifier = makeNotifier();

        const pipeline = new Pipeline([source1, source2], ai, notifier, "You are a briefing assistant.", "Morning", defaultConfig);
        await pipeline.run();

        expect(ai.summarize).toHaveBeenCalledWith(
            "Run: Morning\n\n[Transport]\nLine 700 on time\n\n[Weather]\nSunny, 18°C",
            "You are a briefing assistant."
        );
        expect(notifier.notify).toHaveBeenCalledWith(
            "📋 <b>Morning Briefing — Saturday, 18 April 2026</b>\n\nEverything looks good today."
        );
    });

    it("retries a failing source and succeeds on second attempt", async () => {
        const source: DataSource = {
            name: "Flaky",
            fetchData: vi.fn()
                .mockRejectedValueOnce(new Error("Timeout"))
                .mockResolvedValue("Data on retry"),
        };
        const ai = makeAiProvider();
        const notifier = makeNotifier();

        const pipeline = new Pipeline([source], ai, notifier, "prompt", "Morning", defaultConfig);
        const runPromise = pipeline.run();
        await vi.runAllTimersAsync();
        await runPromise;

        expect(source.fetchData).toHaveBeenCalledTimes(2);
        expect(ai.summarize).toHaveBeenCalledWith("Run: Morning\n\n[Flaky]\nData on retry", "prompt");
    });

    it("retries AI provider on failure and succeeds on second attempt", async () => {
        const source = makeSource("Weather", "Sunny");
        const ai: AIProvider = {
            summarize: vi.fn()
                .mockRejectedValueOnce(new Error("503 Service Unavailable"))
                .mockResolvedValue("Looks good today."),
        };
        const notifier = makeNotifier();

        const pipeline = new Pipeline([source], ai, notifier, "prompt", "Morning", defaultConfig);
        const runPromise = pipeline.run();
        await vi.runAllTimersAsync();
        await runPromise;

        expect(ai.summarize).toHaveBeenCalledTimes(2);
        expect(notifier.notify).toHaveBeenCalledWith(expect.stringContaining("Looks good today."));
    });

    it("throws when AI provider fails all retries", async () => {
        const source = makeSource("Weather", "Sunny");
        const ai: AIProvider = {
            summarize: vi.fn().mockRejectedValue(new Error("503 Service Unavailable")),
        };
        const notifier = makeNotifier();

        const pipeline = new Pipeline([source], ai, notifier, "prompt", "Morning", defaultConfig);
        const runPromise = pipeline.run();
        const assertion = expect(runPromise).rejects.toThrow("503 Service Unavailable");
        await vi.runAllTimersAsync();
        await assertion;

        expect(ai.summarize).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it("logs error and continues when source fails all retries", async () => {
        const source: DataSource = {
            name: "Broken",
            fetchData: vi.fn().mockRejectedValue(new Error("Always fails")),
        };
        const ai = makeAiProvider();
        const notifier = makeNotifier();
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const pipeline = new Pipeline([source], ai, notifier, "prompt", "Afternoon", defaultConfig);
        const runPromise = pipeline.run();
        await vi.runAllTimersAsync();
        await runPromise;

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('"Broken"'),
            expect.any(Error)
        );
        expect(ai.summarize).toHaveBeenCalledWith("Run: Afternoon\n\n[Broken]\nFailed to fetch data.", "prompt");
        consoleSpy.mockRestore();
    });

    it("logs raw source response when LOG_API_RESPONSES is enabled", async () => {
        const source = makeSource("Weather", "Sunny, 18°C");
        const ai = makeAiProvider();
        const notifier = makeNotifier();
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const pipeline = new Pipeline([source], ai, notifier, "prompt", "Morning", { ...defaultConfig, LOG_API_RESPONSES: true });
        await pipeline.run();


        expect(consoleSpy).toHaveBeenCalledWith("[Weather] raw response:\nSunny, 18°C");
        consoleSpy.mockRestore();
    });
});
