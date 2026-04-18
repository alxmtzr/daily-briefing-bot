import { vi, it, describe, expect, beforeEach } from "vitest";
import axios from "axios";
import { WeatherDataSource } from "../src/sources/weather-data-source";

vi.mock("axios");
vi.spyOn(console, "error").mockImplementation(() => { });

const makeWeatherResponse = (overrides: {
    current?: Partial<{ temperature_2m: number; weather_code: number; precipitation: number; wind_speed_10m: number }>;
    daily?: Partial<{ temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[]; weather_code: number[] }>;
} = {}) => ({
    data: {
        current: {
            temperature_2m: 12.3,
            weather_code: 3,
            precipitation: 0.0,
            wind_speed_10m: 10.5,
            ...overrides.current,
        },
        daily: {
            temperature_2m_max: [18.0],
            temperature_2m_min: [8.5],
            precipitation_sum: [0.0],
            weather_code: [3],
            ...overrides.daily,
        },
    },
});

describe("WeatherDataSource", () => {
    let source: WeatherDataSource;

    beforeEach(() => {
        source = new WeatherDataSource("Home (Markdorf)", 47.6928, 9.0343);
    });

    it("includes location name in output", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse());

        const result = await source.fetchData();

        expect(result).toContain("Home (Markdorf)");
    });

    it("includes current temperature and precipitation", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { temperature_2m: 12.3, precipitation: 0.4 },
        }));

        const result = await source.fetchData();

        expect(result).toContain("12.3°C");
        expect(result).toContain("precipitation 0.4mm");
    });

    it("includes current wind speed", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { wind_speed_10m: 25.0 },
        }));

        const result = await source.fetchData();

        expect(result).toContain("wind 25 km/h");
    });

    it("includes daily min/max temperature and precipitation", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            daily: { temperature_2m_min: [6.1], temperature_2m_max: [21.4], precipitation_sum: [3.8] },
        }));

        const result = await source.fetchData();

        expect(result).toContain("min 6.1°C");
        expect(result).toContain("max 21.4°C");
        expect(result).toContain("precipitation 3.8mm");
    });

    it("maps weather code 0 to 'clear sky'", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { weather_code: 0 },
            daily: { weather_code: [0] },
        }));

        const result = await source.fetchData();

        expect(result).toContain("clear sky");
    });

    it("maps weather code 61 to 'rain'", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { weather_code: 61 },
            daily: { weather_code: [61] },
        }));

        const result = await source.fetchData();

        expect(result).toContain("rain");
    });

    it("maps weather code 95 to 'thunderstorm'", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { weather_code: 95 },
            daily: { weather_code: [95] },
        }));

        const result = await source.fetchData();

        expect(result).toContain("thunderstorm");
    });

    it("maps unknown weather code to 'unknown'", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { weather_code: 999 },
        }));

        const result = await source.fetchData();

        expect(result).toContain("unknown");
    });

    it("throws on network error", async () => {
        vi.mocked(axios.get).mockRejectedValue(new Error("Network Error"));

        await expect(source.fetchData()).rejects.toThrow("Network Error");
    });

    it("maps weather code 45 to 'foggy'", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { weather_code: 45 },
        }));

        const result = await source.fetchData();

        expect(result).toContain("fog");
    });

    it("maps weather code 51 to 'drizzle'", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { weather_code: 51 },
        }));

        const result = await source.fetchData();

        expect(result).toContain("drizzle");
    });

    it("maps weather code 71 to 'snow'", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { weather_code: 71 },
        }));

        const result = await source.fetchData();

        expect(result).toContain("snow");
    });

    it("maps weather code 80 to 'rain showers'", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { weather_code: 80 },
        }));

        const result = await source.fetchData();

        expect(result).toContain("rain showers");
    });

    it("maps weather code 85 to 'snow showers'", async () => {
        vi.mocked(axios.get).mockResolvedValue(makeWeatherResponse({
            current: { weather_code: 85 },
        }));

        const result = await source.fetchData();

        expect(result).toContain("snow showers");
    });
});
