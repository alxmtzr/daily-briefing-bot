import { DataSource } from "../interfaces/data-source";
import axios from "axios";
import * as cheerio from "cheerio";

const HALLENBAD_URL = "https://www.ravensburg.de/rv/kultur-freizeit-einkaufen/hallenbad/oeffnungszeiten-preise-hallenbad.php";

export class HallenbadSource implements DataSource {
    readonly name = "Hallenbad Ravensburg";

    async fetchData(): Promise<string> {
        const response = await axios.get(HALLENBAD_URL, {
            timeout: 10000,
            headers: { "User-Agent": "Mozilla/5.0" },
        });
        return this.parse(response.data);
    }

    parse(html: string): string {
        const $ = cheerio.load(html);

        const statusHeading = $(".zeitboxInner h3").first().text().trim();

        const rows: string[] = [];
        $("table.default.responsive tr").each((_, row) => {
            const cells = $(row).find("td").map((_, td) => $(td).text().trim()).get();
            if (cells.length === 2) {
                rows.push(`${cells[0]}: ${cells[1]}`);
            }
        });

        const schedule = rows.join("\n");

        return [
            statusHeading,
            "",
            "Öffnungszeiten:",
            schedule,
            "",
            HALLENBAD_URL,
        ].join("\n");
    }
}
