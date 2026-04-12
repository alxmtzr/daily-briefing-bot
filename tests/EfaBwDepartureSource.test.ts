import { vi, it, describe, expect, beforeEach } from "vitest";
import axios from "axios";
import { EfaBwDepartureSource } from "../src/sources/EfaBwDepartureSource";
import { BUS_LINES_TOWARDS_WORK, BUS_LINES_TOWARDS_HOME } from "../src/common/constants";
import { StopEvent } from "../src/types/EfaBwTypes";

vi.mock("axios");
vi.spyOn(console, "error").mockImplementation(() => {});

const makeStopEvent = (overrides: Partial<StopEvent> = {}): StopEvent => ({
    transportation: {
        number: "700",
        destination: { name: "Konstanz Bahnhof" }
    },
    departureTimePlanned: "2026-04-14T05:35:00Z",     // 07:35 Berlin time
    departureTimeEstimated: "2026-04-14T05:35:00Z",
    infos: [],
    ...overrides
});

describe("EfaBwDepartureSource", () => {
    let source: EfaBwDepartureSource;

    beforeEach(() => {
        source = new EfaBwDepartureSource("Morning bus", "7708000", BUS_LINES_TOWARDS_WORK, "0735");
    });

    it("formats on-time departures correctly", async () => {
        const event = makeStopEvent();
        vi.mocked(axios.get).mockResolvedValue({ data: { stopEvents: [event] } });

        const result = await source.fetchData();

        expect(result).toContain("Line 700 → Konstanz Bahnhof");
        expect(result).toContain("07:35");
        expect(result).toContain("on time");
    });

    it("formats delayed departures correctly", async () => {
        const event = makeStopEvent({
            departureTimeEstimated: "2026-04-14T05:38:00Z"  // 3 min late
        });
        vi.mocked(axios.get).mockResolvedValue({ data: { stopEvents: [event] } });

        const result = await source.fetchData();

        expect(result).toContain("+3 min");
    });

    it("shows 'estimated time not available' when departureTimeEstimated is missing", async () => {
        const event = makeStopEvent({ departureTimeEstimated: undefined });
        vi.mocked(axios.get).mockResolvedValue({ data: { stopEvents: [event] } });

        const result = await source.fetchData();

        expect(result).toContain("estimated time not available");
    });

    it("filters out events not matching BUS_LINES", async () => {
        const irrelevantEvent = makeStopEvent({
            transportation: { number: "1", destination: { name: "Weingarten Post" } }
        });
        vi.mocked(axios.get).mockResolvedValue({ data: { stopEvents: [irrelevantEvent] } });

        const result = await source.fetchData();

        expect(result).not.toContain("Line 1");
    });

    it("filters out events with wrong direction", async () => {
        const wrongDirection = makeStopEvent({
            transportation: { number: "700", destination: { name: "Ravensburg Bahnhof" } }
        });
        vi.mocked(axios.get).mockResolvedValue({ data: { stopEvents: [wrongDirection] } });

        const result = await source.fetchData();

        expect(result).not.toContain("Line 700");
    });

    it("returns disruption notices when no relevant departures found", async () => {
        const irrelevantEvent = makeStopEvent({
            transportation: { number: "1", destination: { name: "Weingarten Post" } },
            infos: [{
                id: "ems-test",
                infoLinks: [{
                    urlText: "Haltausfall durch Baustelle",
                    content: "<b>Haltausfall</b> wegen einer Baustelle."
                }]
            }]
        });
        vi.mocked(axios.get).mockResolvedValue({ data: { stopEvents: [irrelevantEvent] } });

        const result = await source.fetchData();

        expect(result).toContain("No relevant departures found. Disruption notices:");
        expect(result).toContain("Haltausfall wegen einer Baustelle.");
        expect(result).not.toContain("<b>");
    });

    it("deduplicates disruption notices with same id", async () => {
        const sharedInfo = {
            id: "ems-test",
            infoLinks: [{ urlText: "Baustelle", content: "Baustelle wegen Bauarbeiten." }]
        };
        const events = [
            makeStopEvent({ transportation: { number: "1", destination: { name: "X" } }, infos: [sharedInfo] }),
            makeStopEvent({ transportation: { number: "2", destination: { name: "Y" } }, infos: [sharedInfo] }),
        ];
        vi.mocked(axios.get).mockResolvedValue({ data: { stopEvents: events } });

        const result = await source.fetchData();

        const count = (result.match(/Baustelle/g) ?? []).length;
        expect(count).toBe(1);
    });

    it("returns generic message when no departures and no infos", async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: { stopEvents: [] } });

        const result = await source.fetchData();

        expect(result).toBe("No relevant departures found.");
    });

    it("handles fetch errors", async () => {
        vi.mocked(axios.get).mockRejectedValue(new Error("Network Error"));

        await expect(source.fetchData()).rejects.toThrow("Network Error");
    });

    it("accepts alternative destination for same line number", async () => {
        const event = makeStopEvent({
            transportation: { number: "710", destination: { name: "Markdorf Bahnhof" } }
        });
        vi.mocked(axios.get).mockResolvedValue({ data: { stopEvents: [event] } });

        const result = await source.fetchData();

        expect(result).toContain("Line 710 → Markdorf Bahnhof");
    });

    it("works with BUS_LINES_TOWARDS_HOME", async () => {
        const homeSource = new EfaBwDepartureSource("Afternoon bus", "7704147", BUS_LINES_TOWARDS_HOME, "1600");
        const event = makeStopEvent({
            transportation: { number: "700", destination: { name: "Ravensburg Bahnhof" } }
        });
        vi.mocked(axios.get).mockResolvedValue({ data: { stopEvents: [event] } });

        const result = await homeSource.fetchData();

        expect(result).toContain("Line 700 → Ravensburg Bahnhof");
    });
});
