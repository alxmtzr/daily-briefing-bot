import { it, describe, expect } from "vitest";
import { HallenbadSource } from "../../src/sources/hallenbad-source";

describe("HallenbadSource — Integration", () => {
    it("fetches real Hallenbad page and returns status, schedule, and URL", async () => {
        const source = new HallenbadSource();

        const result = await source.fetchData();

        expect(result).toMatch(/Hallenbad heute (geöffnet|geschlossen)/i);
        expect(result).toContain("Montag");
        expect(result).toContain("Uhr");
        expect(result).toContain("https://www.ravensburg.de/rv/kultur-freizeit-einkaufen/hallenbad/oeffnungszeiten-preise-hallenbad.php");
    }, 15000);
});
