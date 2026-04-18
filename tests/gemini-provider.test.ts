import { vi, it, describe, expect, beforeEach, afterEach } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({
    mockGenerateContent: vi.fn(),
}));

vi.mock("@google/generative-ai", () => ({
    GoogleGenerativeAI: vi.fn(function () {
        return {
            getGenerativeModel: vi.fn(() => ({ generateContent: mockGenerateContent })),
        };
    }),
}));

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiProvider } from "../src/providers/gemini-provider";

describe("GeminiProvider", () => {
    beforeEach(() => {
        process.env.AI_API_KEY = "test-api-key";
        vi.mocked(GoogleGenerativeAI).mockClear();
        mockGenerateContent.mockReset();
    });

    afterEach(() => {
        delete process.env.AI_API_KEY;
    });

    it("throws if AI_API_KEY is not set", () => {
        delete process.env.AI_API_KEY;
        expect(() => new GeminiProvider()).toThrow("AI_API_KEY is not set");
    });

    it("initializes with the correct model", () => {
        const provider = new GeminiProvider();
        const instance = vi.mocked(GoogleGenerativeAI).mock.results[0].value;
        expect(instance.getGenerativeModel).toHaveBeenCalledWith({ model: "gemini-flash-latest" });
        expect(provider).toBeDefined();
    });

    it("passes data and system prompt to generateContent", async () => {
        const provider = new GeminiProvider();
        mockGenerateContent.mockResolvedValue({ response: { text: () => "Briefing result" } });

        await provider.summarize("transport and weather data", "You are a briefing assistant.");

        expect(mockGenerateContent).toHaveBeenCalledWith({
            systemInstruction: "You are a briefing assistant.",
            contents: [{ role: "user", parts: [{ text: "transport and weather data" }] }],
        });
    });

    it("returns the text from the Gemini response", async () => {
        const provider = new GeminiProvider();
        mockGenerateContent.mockResolvedValue({ response: { text: () => "Take an umbrella today." } });

        const result = await provider.summarize("data", "prompt");

        expect(result).toBe("Take an umbrella today.");
    });

    it("propagates errors from the Gemini API", async () => {
        const provider = new GeminiProvider();
        mockGenerateContent.mockRejectedValue(new Error("API quota exceeded"));

        await expect(provider.summarize("data", "prompt")).rejects.toThrow("API quota exceeded");
    });
});
