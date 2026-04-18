import { DataSource } from "../interfaces/data-source";
import axios from "axios";
import * as cheerio from "cheerio";

export class WebScraperSource implements DataSource {

    constructor(public name: string, private readonly url: string, private readonly selector: string) {}

    async fetchData(): Promise<string> {
        const response = await axios.get(this.url, { timeout: 10000 });
        return this.extractRelevantData(response.data);
    }

    private extractRelevantData(html: string): string {
        if (this.selector === "") {
            return html;
        }
        const $ = cheerio.load(html);
        const text = $(this.selector).text();
        return text;
    }

}