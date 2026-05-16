import "dotenv/config";
import { getTrendingStocks } from "./src/app/actions/dashboard";

async function main() {
  try {
    const res = await getTrendingStocks();
    console.log("Response:", res);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
main();
