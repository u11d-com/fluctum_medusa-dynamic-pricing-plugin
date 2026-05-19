import { ICacheService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { getPluginOptions } from "../modules/dynamic-pricing/options-store"
import { fetchAndSaveSpotPricesWorkflow } from "../workflows/index"

const LAST_FETCHED_AT_KEY = "dynamic-pricing:last-fetched-at"

export default async function fetchSpotPricesJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const { materials, fetchIntervalSeconds } = getPluginOptions()

  // For intervals >= 60s the cron fires more often than needed (every 10s).
  // Use Redis cache to skip executions until the configured interval elapses.
  if (fetchIntervalSeconds >= 60) {
    const cache = container.resolve<ICacheService>(Modules.CACHE)
    const lastFetchedAt = await cache.get<number>(LAST_FETCHED_AT_KEY)
    const elapsedSeconds =
      lastFetchedAt != null ? (Date.now() - lastFetchedAt) / 1000 : Infinity

    if (elapsedSeconds < fetchIntervalSeconds) {
      logger.debug(
        `[dynamic-pricing-plugin] Skipping — next fetch in ${Math.ceil(fetchIntervalSeconds - elapsedSeconds)}s`
      )
      return
    }
  }

  logger.debug(`[dynamic-pricing-plugin] Fetching spot prices for: ${materials.join(", ")}`)

  const { result } = await fetchAndSaveSpotPricesWorkflow(container).run({
    input: { materials },
  })

  if (fetchIntervalSeconds >= 60) {
    const cache = container.resolve<ICacheService>(Modules.CACHE)
    await cache.set(LAST_FETCHED_AT_KEY, Date.now())
  }

  const timestamp = new Date().toISOString()
  const summary = result.map((r) => `${r.material}=${r.price}`).join(", ")
  logger.info(`[dynamic-pricing-plugin] Spot prices updated at ${timestamp}: ${summary}`)
}

// Fires every 10 seconds (6-field cron with seconds, supported by cron-parser
// which is used by both the in-memory and Redis workflow engines).
// For fetchIntervalSeconds >= 60 the job body handles rate-limiting via cache.
export const config = {
  name: "fetch-spot-prices",
  schedule: "*/10 * * * * *",
}
