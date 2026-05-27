"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"
import { SpotPricePayload } from "types/spot-price"

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
