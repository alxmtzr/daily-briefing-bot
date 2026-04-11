import "dotenv/config";
import { WebScraperSource } from "./sources/WebScraperSource";
import { DataSource } from "./interfaces/DataSource";

export const main = async (): Promise<void> => {
  console.log("Daily Briefing Bot started.");
  const scraper: DataSource = new WebScraperSource("Stadtbus Ravensburg Weingarten Source", process.env.SCRAPE_URL!);
  try {
    const data = await scraper.fetchData();
    console.log("Fetched data:", data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// istanbul ignore next
if (require.main === module) {
  main();
}
