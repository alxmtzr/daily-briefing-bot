import { describe, it, expect, vi } from "vitest";
import axios from "axios";
import { HallenbadSource } from "../src/sources/hallenbad-source";

vi.mock("axios");

const HALLENBAD_URL = "https://www.ravensburg.de/rv/kultur-freizeit-einkaufen/hallenbad/oeffnungszeiten-preise-hallenbad.php";

const makeHtml = (heading: string) => `
<div class="zeitboxInner">
  <h3>${heading}</h3>
</div>
<table class="default responsive">
  <tr><td><p>Montag</p></td><td><p>geschlossen</p></td></tr>
  <tr><td><p>Dienstag</p></td><td><p>15 - 20 Uhr</p></td></tr>
  <tr><td><p>Samstag</p></td><td><p>10 - 19 Uhr</p></td></tr>
</table>
`;

describe("HallenbadSource", () => {
    it("parse() returns status heading, schedule, and URL when open", () => {
        const source = new HallenbadSource();
        const result = source.parse(makeHtml("FLEXIBETRIEB - Hallenbad heute geöffnet"));

        expect(result).toContain("FLEXIBETRIEB - Hallenbad heute geöffnet");
        expect(result).toContain("Montag: geschlossen");
        expect(result).toContain("Dienstag: 15 - 20 Uhr");
        expect(result).toContain("Samstag: 10 - 19 Uhr");
        expect(result).toContain(HALLENBAD_URL);
    });

    it("parse() returns closed status heading when closed", () => {
        const source = new HallenbadSource();
        const result = source.parse(makeHtml("Hallenbad heute geschlossen"));

        expect(result).toContain("Hallenbad heute geschlossen");
        expect(result).toContain(HALLENBAD_URL);
    });

    it("fetchData() calls the correct URL and returns parsed text", async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: makeHtml("Hallenbad heute geöffnet") });
        const source = new HallenbadSource();

        const result = await source.fetchData();

        expect(axios.get).toHaveBeenCalledWith(HALLENBAD_URL, expect.objectContaining({ timeout: 10000 }));
        expect(result).toContain("Hallenbad heute geöffnet");
    });

    it("fetchData() propagates network errors", async () => {
        vi.mocked(axios.get).mockRejectedValue(new Error("Network error"));
        const source = new HallenbadSource();

        await expect(source.fetchData()).rejects.toThrow("Network error");
    });
});
