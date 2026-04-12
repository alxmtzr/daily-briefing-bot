import "dotenv/config";
import { WebScraperSource } from "./sources/WebScraperSource";
import { DataSource } from "./interfaces/DataSource";
import { EfaBwDepartureSource } from "./sources/EfaBwDepartureSource";
import { BUS_LINES_TOWARDS_HOME, BUS_LINES_TOWARDS_WORK } from "./common/constants";

export const main = async (): Promise<void> => {
  console.log("Daily Briefing Bot started.");

  // --- EfaBwDepartureSource example ---
  const towardsWork: DataSource = new EfaBwDepartureSource("Towards work", process.env.TRANSPORT_STOP_1!, BUS_LINES_TOWARDS_WORK, "0715");
  try {
    const data = await towardsWork.fetchData();
    console.log("Fetched data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  const towardsHome: DataSource = new EfaBwDepartureSource("Towards home", process.env.TRANSPORT_STOP_2!, BUS_LINES_TOWARDS_HOME, "1615");
  try {
    const data = await towardsHome.fetchData();
    console.log("Fetched data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// istanbul ignore next
if (require.main === module) {
  main();
}
