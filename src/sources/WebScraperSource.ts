import { DataSource } from "../interfaces/DataSource";
import axios from "axios";

export class WebScraperSource implements DataSource {

    constructor(public name: string, private readonly url: string) {}

    async fetchData(): Promise<string> {
        try {
            const response = await axios.get(this.url);
            return response.data;
        } catch (error) {
            console.error(`Error fetching data from ${this.url}:`, error);
            throw error;
        }
    }

}