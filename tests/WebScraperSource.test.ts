import { vi, it, describe, expect } from "vitest";
import axios from "axios";
import { WebScraperSource } from "../src/sources/WebScraperSource";

vi.mock("axios");
vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error output during tests

describe("WebScraperSource", () => {
    it("fetches data successfully", async () => {
        const mockData = "<html><body>Test Data</body></html>";
        vi.mocked(axios.get).mockResolvedValue({ data: mockData })
        
        const source = new WebScraperSource("Test Source", "http://example.com");
        const data = await source.fetchData();

        expect(data).toBe(mockData);
        expect(axios.get).toHaveBeenCalledWith("http://example.com");
    });

    it("handles fetch errors", async () => {
        const mockError = new Error("Network Error");
        vi.mocked(axios.get).mockRejectedValue(mockError);
        
        const source = new WebScraperSource("Test Source", "http://example.com");
        
        await expect(source.fetchData()).rejects.toThrow("Network Error");
        expect(axios.get).toHaveBeenCalledWith("http://example.com");
    });
});