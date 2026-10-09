import type DynamicPricingModuleService from "../modules/dynamic-pricing/service"
import { createSimpleCache } from "./cache"

type LatestSpotPrices = Awaited<ReturnType<DynamicPricingModuleService["getLatestSpotPrices"]>>
type LatestRates = Awaited<ReturnType<DynamicPricingModuleService["getLatestRates"]>>

/**
 * Per-process read-through caches for the hot storefront read paths
 * (spot-prices, currency-rates, SSE initial payload). Spot prices change at
 * most once per fetch interval (>= 10 s), so a few seconds of staleness is
 * invisible to users while collapsing N concurrent requests into one query.
 */
const spotPricesCache = createSimpleCache<LatestSpotPrices>(2_000)
const ratesCache = createSimpleCache<LatestRates>(60_000)

export function getCachedLatestSpotPrices(
  service: DynamicPricingModuleService
): Promise<LatestSpotPrices> {
  return spotPricesCache.getOrLoad(() => service.getLatestSpotPrices())
}

export function getCachedLatestRates(
  service: DynamicPricingModuleService,
  fromCurrency: string
): Promise<LatestRates> {
  return ratesCache.getOrLoad(() => service.getLatestRates(fromCurrency))
}
