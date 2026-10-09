import { MedusaContainer } from "@medusajs/framework/types"
import { pruneSpotPricesWorkflow } from "../workflows/prune-spot-prices"

/**
 * Keeps spot_price bounded: all rows from the last 24 h, hourly samples up to
 * 30 days, daily samples beyond that.
 */
export default async function pruneSpotPricesJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const { result: deleted } = await pruneSpotPricesWorkflow(container).run()
  logger.info(`[dynamic-pricing-plugin] Pruned ${deleted} historical spot price rows`)
}

export const config = {
  name: "prune-spot-prices",
  schedule: "15 * * * *", // hourly, offset from the top-of-hour currency refresh
}
