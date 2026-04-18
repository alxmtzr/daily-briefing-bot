import { describe, it, expect, vi } from "vitest";
import { Pipeline } from "../src/pipeline";
import { DataSource } from "../src/interfaces/data-source";
import { AIProvider } from "../src/interfaces/ai-provider";
import { Notifier } from "../src/interfaces/notifier";

vi.useFakeTimers();

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
        const source1 = makeSource("Transport", "Line 700 on time");
        const source2 = makeSource("Weather", "Sunny, 18°C");
        const ai = makeAiProvider("Everything looks good today.");
        const notifier = makeNotifier();

        const pipeline = new Pipeline([source1, source2], ai, notifier, "You are a briefing assistant.", "Morning");
        await pipeline.run();

        expect(ai.summarize).toHaveBeenCalledWith(
            "Run: Morning\n\n[Transport]\nLine 700 on time\n\n[Weather]\nSunny, 18°C",
            "You are a briefing assistant."
        );
        expect(notifier.notify).toHaveBeenCalledWith("Everything looks good today.");
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

        const pipeline = new Pipeline([source], ai, notifier, "prompt", "Morning");
        const runPromise = pipeline.run();
        await vi.runAllTimersAsync();
        await runPromise;

        expect(source.fetchData).toHaveBeenCalledTimes(2);
        expect(ai.summarize).toHaveBeenCalledWith("Run: Morning\n\n[Flaky]\nData on retry", "prompt");
    });

    it("logs error and continues when source fails all retries", async () => {
        const source: DataSource = {
            name: "Broken",
            fetchData: vi.fn().mockRejectedValue(new Error("Always fails")),
        };
        const ai = makeAiProvider();
        const notifier = makeNotifier();
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const pipeline = new Pipeline([source], ai, notifier, "prompt", "Afternoon");
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
});
