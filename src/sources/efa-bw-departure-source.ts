import axios from "axios";
import * as cheerio from "cheerio";
import { DataSource } from "../interfaces/data-source";
import { StopEvent } from "../types/efa-bw-types";

export class EfaBwDepartureSource implements DataSource {
    private readonly BASE_URL : string = "https://www.efa-bw.de/nvbw";

    constructor(
        public name: string, 
        private readonly stopId: string,
        private readonly busLines: Record<string, readonly string[]>,
        private readonly timeOfDeparture: string
    ) {}

    async fetchData(): Promise<string> {
        const today = new Date();
        const date = today.toISOString().slice(0, 10).replaceAll("-", ""); // "2026-04-12" -> "20260412"

        const requestUrl = `${this.BASE_URL}/XML_DM_REQUEST?type_dm=stopID&name_dm=${this.stopId}&outputFormat=rapidJSON&mode=direct&useRealtime=1&itdDateTimeDepArr=dep&limit=50&itdTime=${this.timeOfDeparture}&itdDate=${date}`;
        const response = await axios.get(requestUrl, { timeout: 10000 });
        return this.extractRelevantData(response.data);
    }

    private extractRelevantData(responseData: { stopEvents: StopEvent[] }): string {
        const filtered = responseData.stopEvents
                            .filter(e => 
                                e.transportation.number in this.busLines &&
                                this.busLines[e.transportation.number].includes(e.transportation.destination.name))
                            .map(e => {
                                const planned = e.departureTimePlanned        // "2026-04-12T07:35:00Z"
                                const estimated = e.departureTimeEstimated    // "2026-04-12T07:38:00Z"
                                
                                const time = new Date(planned).toLocaleTimeString('de-DE', { 
                                    timeZone: 'Europe/Berlin', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                });

                                if (!estimated) {
                                    return `Line ${e.transportation.number} → ${e.transportation.destination.name} | ${time} (estimated time not available)`;
                                }
                                const delay = Math.round((new Date(estimated).getTime() - new Date(planned).getTime()) / 60000)
                                const delayLabel = delay <= 0 ? 'on time' : `+${delay} min`
                                
                                return `Line ${e.transportation.number} → ${e.transportation.destination.name} | ${time} (${delayLabel})`
                            })

        if (filtered.length === 0) {
            return this.searchForReason(responseData.stopEvents);
        }

        return filtered.join("\n");
    }

    private searchForReason(stopEvents: StopEvent[]): string {
        const allInfos = stopEvents.flatMap(e => e.infos ?? []);
        const uniqueInfos = new Map(allInfos.map(info => [info.id, info]));

        const notices = [...uniqueInfos.values()]
            .flatMap(info => info.infoLinks.map(link => {
                const details = cheerio.load(link.content).text()
                                    .replaceAll(/\s+/g, ' ')
                                    .trim();

                return `${details}`;
            }));

        return notices.length > 0
            ? `No relevant departures found. Disruption notices:\n${notices.join('\n\n')}`
            : "No relevant departures found.";
    }
}