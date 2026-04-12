import "dotenv/config";
import { DataSource } from "./interfaces/DataSource";
import { EfaBwDepartureSource } from "./sources/EfaBwDepartureSource";
import { BUS_LINES_TOWARDS_HOME, BUS_LINES_TOWARDS_WORK } from "./common/constants";

export const main = async (): Promise<void> => {
  console.log("Daily Briefing Bot started.");

  // --- EfaBwDepartureSource example ---
  const towardsWork: DataSource = new EfaBwDepartureSource("Towards work", process.env.TRANSPORT_STOP_1!, BUS_LINES_TOWARDS_WORK, "0715");
  let result: string = "";
  try {
    result = await towardsWork.fetchData();
    console.log("Fetched data:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  if (result.includes("No relevant departures found")) {
    const towardsWorkFromDifferentStop: DataSource = new EfaBwDepartureSource("Towards work (alternative stop)", process.env.TRANSPORT_STOP_ALTERNATIVE!, BUS_LINES_TOWARDS_WORK, "0715");
    try {
      result = await towardsWorkFromDifferentStop.fetchData();
      console.log("Fetched data from alternative stop:", JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Error fetching data from alternative stop:", error);
    }
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
