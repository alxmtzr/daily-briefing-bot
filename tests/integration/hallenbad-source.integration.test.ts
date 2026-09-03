import { it, describe, expect, TestContext } from "vitest";
import axios from "axios";
import { HallenbadSource } from "../../src/sources/hallenbad-source";

const skipWhenHallenbadPageUnavailable = (error: unknown, context: TestContext) => {
    if (!axios.isAxiosError(error)) {
        throw error;
    }

    const statusCode = error.response?.status;
    if (statusCode && statusCode >= 500) {
        context.skip(`Ravensburg Hallenbad page unavailable (HTTP ${statusCode})`);
        return;
    }

    const networkCodes = ["ENOTFOUND", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"];
    if (error.code && networkCodes.includes(error.code)) {
        context.skip(`Ravensburg Hallenbad page unavailable (${error.code})`);
        return;
    }

    throw error;
};

describe("HallenbadSource — Integration", () => {
    it("fetches real Hallenbad page and returns status, schedule, and URL", async (context) => {
        const source = new HallenbadSource();

        try {
            const result = await source.fetchData();

            expect(result).toMatch(/(Hallenbad heute (geöffnet|geschlossen)|Hallenbadsaison beginnt)/i);
            expect(result).toContain("Montag");
            expect(result).toContain("Uhr");
            expect(result).toContain("https://www.ravensburg.de/rv/kultur-freizeit-einkaufen/hallenbad/oeffnungszeiten-preise-hallenbad.php");
        } catch (error) {
            skipWhenHallenbadPageUnavailable(error, context);
        }
    }, 15000);
});
