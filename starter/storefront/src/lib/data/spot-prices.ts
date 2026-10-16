"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"
import type { SpotPricePayload } from "@u11d/medusa-dynamic-pricing/client"

export const listSpotPrices = async (
  material?: string
): Promise<SpotPricePayload[]> => {
  const next = {
    ...(await getCacheOptions("spot-prices")),
  }

  const query: Record<string, string> = {}
  if (material) {
    query.material = material
  }

  return sdk.client
    .fetch<{ spot_prices: SpotPricePayload[] }>(
      "/store/dynamic-pricing/spot-prices",
      {
        method: "GET",
        query,
        next,
        cache: "no-store",
      }
    )
    .then((res) => res.spot_prices)
}

/** FX rates from the plugin's pricing currency, keyed by uppercase ISO 4217 code. */
export const listCurrencyRates = async (): Promise<Record<string, number>> => {
  return sdk.client
    .fetch<{ rates: Record<string, number> }>(
      "/store/dynamic-pricing/currency-rates",
      {
        method: "GET",
        next: { revalidate: 300 },
        cache: "force-cache",
      }
    )
    .then((res) => res.rates)
}
