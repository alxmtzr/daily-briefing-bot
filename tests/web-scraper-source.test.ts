import { vi, it, describe, expect } from "vitest";
import axios from "axios";
import { WebScraperSource } from "../src/sources/web-scraper-source";

vi.mock("axios");
vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error output during tests

const mockUrl = "http://example.com";
const mockSelector = "#test";

describe("WebScraperSource", () => {
    it("fetches data successfully", async () => {
        const mockData = "<html><body>Test Data</body></html>";
        vi.mocked(axios.get).mockResolvedValue({ data: mockData })
        
        const source = new WebScraperSource("Test Source", mockUrl, "");
        const data = await source.fetchData();

        expect(data).toBe(mockData);
        expect(axios.get).toHaveBeenCalledWith(mockUrl);
    });

    it("handles fetch errors", async () => {
        const mockError = new Error("Network Error");
        vi.mocked(axios.get).mockRejectedValue(mockError);
        
        const source = new WebScraperSource("Test Source", mockUrl, "");
        
        await expect(source.fetchData()).rejects.toThrow("Network Error");
        expect(axios.get).toHaveBeenCalledWith(mockUrl);
    });

    it("extracts relevant data correctly", () => {
        const html = `<html><body><div id="test">Extracted Data</div></body></html>`;
        const source = new WebScraperSource("Test Source", mockUrl, mockSelector);
        const extractedData = source.extractRelevantData(html);

        expect(extractedData).toBe("Extracted Data");
    });
});