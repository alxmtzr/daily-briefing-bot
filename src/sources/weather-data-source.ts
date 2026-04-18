import axios from "axios";
import { DataSource } from "../interfaces/data-source";

interface CurrentWeather {
    temperature_2m: number;
    weather_code: number;
    precipitation: number;
    wind_speed_10m: number;
}

interface DailyWeather {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weather_code: number[];
}

interface OpenMeteoResponse {
    current: CurrentWeather;
    daily: DailyWeather;
}

export class WeatherDataSource implements DataSource {
    private readonly BASE_URL: string = "https://api.open-meteo.com/v1/forecast";

    constructor(
        public name: string,
        private readonly LATITUDE: number,
        private readonly LONGITUDE: number
    ) {}

    async fetchData(): Promise<string> {
        const requestUrl =
            `${this.BASE_URL}` +
            `?latitude=${this.LATITUDE}` +
            `&longitude=${this.LONGITUDE}` +
            `&current=temperature_2m,weather_code,precipitation,wind_speed_10m` +
            `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code` +
            `&timezone=Europe%2FBerlin` +
            `&forecast_days=1`;

        const response = await axios.get<OpenMeteoResponse>(requestUrl, { timeout: 10000 });
        return this.extractRelevantData(response.data);
    }

    private extractRelevantData(data: OpenMeteoResponse): string {
        const current = data.current;
        const daily = data.daily;

        const currentDesc = this.describeWeatherCode(current.weather_code);
        const dailyDesc = this.describeWeatherCode(daily.weather_code[0]);

        return (
            `Weather at ${this.name}:\n` +
            `Current: ${current.temperature_2m}°C, ${currentDesc}, precipitation ${current.precipitation}mm, wind ${current.wind_speed_10m} km/h\n` +
            `Today: min ${daily.temperature_2m_min[0]}°C / max ${daily.temperature_2m_max[0]}°C, ${dailyDesc}, precipitation ${daily.precipitation_sum[0]}mm`
        );
    }

    private static readonly WEATHER_DESCRIPTIONS: Record<number, string> = {
        0: "clear sky",
        1: "mainly clear", 2: "partly cloudy", 3: "overcast",
        45: "fog", 48: "rime fog",
        51: "light drizzle", 53: "moderate drizzle", 55: "dense drizzle",
        56: "light freezing drizzle", 57: "heavy freezing drizzle",
        61: "slight rain", 63: "moderate rain", 65: "heavy rain",
        66: "light freezing rain", 67: "heavy freezing rain",
        71: "slight snow", 73: "moderate snow", 75: "heavy snow",
        77: "snow grains",
        80: "slight rain showers", 81: "moderate rain showers", 82: "violent rain showers",
        85: "slight snow showers", 86: "heavy snow showers",
        95: "thunderstorm",
        96: "thunderstorm with slight hail", 99: "thunderstorm with heavy hail",
    };

    private describeWeatherCode(code: number): string {
        return WeatherDataSource.WEATHER_DESCRIPTIONS[code] ?? "unknown";
    }
}
