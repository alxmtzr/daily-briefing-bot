export interface AIProvider {
    summarize(input: string, systemPrompt: string): Promise<string>;
}