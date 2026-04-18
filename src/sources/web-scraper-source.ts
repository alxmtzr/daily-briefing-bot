import { DataSource } from "../interfaces/data-source";
import axios from "axios";
import * as cheerio from "cheerio";

export class WebScraperSource implements DataSource {

    constructor(public name: string, private readonly url: string, private readonly selector: string) {}

    async fetchData(): Promise<string> {
        try {
            const response = await axios.get(this.url);
            return this.extractRelevantData(response.data);
        } catch (error) {
            console.error(`Error fetching data from ${this.url}:`, error);
            throw error;
        }
    }

    extractRelevantData(html: string): string {
        if (this.selector === "") {
            return html;
        }
        const $ = cheerio.load(html);
        const text = $(this.selector).text();
        return text;
    }

}