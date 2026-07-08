import { ICacheService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { getPluginOptions } from "../modules/dynamic-pricing/options-store"
import { refreshCurrencyRatesWorkflow } from "../workflows/refresh-currency-rates"

export const LAST_RATES_FETCHED_AT_KEY = "dynamic-pricing:last-rates-fetched-at"

export default async function refreshCurrencyRatesJob(container: MedusaContainer) {
  const options = getPluginOptions()
  if (!options.currencyConversion) return  // job is a no-op when not configured

  const logger = container.resolve("logger")
  const { refreshIntervalSeconds } = options.currencyConversion

  const cache = refreshIntervalSeconds >= 60
    ? container.resolve<ICacheService>(Modules.CACHE)
    : null

  if (cache) {
    const lastFetchedAt = await cache.get<number>(LAST_RATES_FETCHED_AT_KEY)
    if (lastFetchedAt != null) {
      const elapsed = (Date.now() - lastFetchedAt) / 1000
      if (elapsed < refreshIntervalSeconds) {
        logger.debug(`[dynamic-pricing-plugin] Skipping rates — next refresh in ${Math.ceil(refreshIntervalSeconds - elapsed)}s`)
        return
      }
    }
  }

  logger.debug(`[dynamic-pricing-plugin] Refreshing currency rates from ${options.pricingCurrency}`)
  await refreshCurrencyRatesWorkflow(container).run({})

  if (cache) {
    await cache.set(LAST_RATES_FETCHED_AT_KEY, Date.now())
  }
  logger.info(`[dynamic-pricing-plugin] Currency rates refreshed at ${new Date().toISOString()}`)
}

export const config = {
  name: "refresh-currency-rates",
  schedule: "0 * * * *",  // every hour
}
