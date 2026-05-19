import type { PriceProviderFn, SpotPriceResult } from "../../types.js"

export type GoldApiProviderOptions = {
  /**
   * Your goldapi.io API key.
   * Obtain one at https://www.goldapi.io/dashboard
   */
  apiKey: string
  /**
   * Currency to fetch prices in.
   * @default "USD"
   */
  currency?: string
}

/**
 * Factory that creates a GoldAPI.io price provider.
 *
 * The API key is passed explicitly so the plugin remains environment-agnostic.
 * Read the key from your environment in medusa-config.ts and pass it here.
 *
 * Usage in medusa-config.ts:
 * ```ts
 * import { createGoldApiProvider } from "@u11d/dynamic-pricing-plugin/providers/gold-api"
 *
 * options: {
 *   materials: ["XAU", "XAG"],
 *   provider: createGoldApiProvider({ apiKey: process.env.GOLD_API_KEY! }),
 * }
 * ```
 *
 * API docs: https://www.goldapi.io/dashboard
 */
export function createGoldApiProvider(
  opts: GoldApiProviderOptions
): PriceProviderFn {
  const { apiKey, currency = "USD" } = opts

  if (!apiKey) {
    throw new Error(
      "[createGoldApiProvider] apiKey is required. Pass it explicitly via options."
    )
  }

  const provider: PriceProviderFn = async (
    materials: string[]
  ): Promise<SpotPriceResult[]> => {
    const results: SpotPriceResult[] = []

    for (const material of materials) {
      const symbol = material.toUpperCase()
      const url = `https://www.goldapi.io/api/${symbol}/${currency}`

      const response = await fetch(url, {
        headers: {
          "x-access-token": apiKey,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(
          `[createGoldApiProvider] Failed to fetch price for ${symbol}: HTTP ${response.status}`
        )
      }

      const data = (await response.json()) as {
        price: number
        ask: number
        bid: number
      }

      results.push({
        material: symbol,
        price: data.price,
        ask: data.ask ?? data.price,
        bid: data.bid ?? data.price,
      })
    }

    return results
  }

  // Name the function for logging clarity
  Object.defineProperty(provider, "name", { value: "goldApiProvider" })

  return provider
}
