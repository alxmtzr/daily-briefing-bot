export interface AIProvider {
    summarize(input: string): Promise<string>;
}