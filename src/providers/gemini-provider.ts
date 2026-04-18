import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider } from "../interfaces/ai-provider";

export class GeminiProvider implements AIProvider {
    private readonly model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

    constructor() {
        const apiKey = process.env.AI_API_KEY;
        if (!apiKey) throw new Error("AI_API_KEY is not set");

        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    async summarize(data: string, systemPrompt: string): Promise<string> {
        const result = await this.model.generateContent({
            systemInstruction: systemPrompt,
            contents: [{ role: "user", parts: [{ text: data }] }],
        });
        return result.response.text();
    }
}
