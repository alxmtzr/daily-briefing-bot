export interface DataSource {
    name: string;

    fetchData(): Promise<string>;
}