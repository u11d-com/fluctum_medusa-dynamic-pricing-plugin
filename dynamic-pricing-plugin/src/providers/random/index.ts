import type { PriceProviderFn, SpotPriceResult } from "../../types.js"

/**
 * Base "realistic" mid-prices per material symbol.
 * These are approximate real-world reference values in USD.
 */
const BASE_PRICES: Record<string, number> = {
  XAU: 2000, // gold, $/troy oz
  XAG: 25, // silver, $/troy oz
  XPT: 980, // platinum
  XPD: 1050, // palladium
}

/** Fallback base price for unknown materials */
const DEFAULT_BASE_PRICE = 100

/**
 * Amplitude of the sinusoidal drift as a fraction of the base price.
 * e.g. 0.02 = ±2% swing over the full sine cycle.
 */
const DRIFT_AMPLITUDE = 0.02

/**
 * Full sine-wave period in milliseconds (20 minutes).
 * Prices complete one full oscillation every 20 min.
 */
const DRIFT_PERIOD_MS = 20 * 60 * 1000

/**
 * Spread between ask and bid as a fraction of the mid price.
 * e.g. 0.001 = 0.1% spread (realistic for spot metals).
 */
const SPREAD_FRACTION = 0.001

/**
 * Small random noise added to each tick as a fraction of the base price.
 * e.g. 0.001 = ±0.1% random jitter per fetch.
 */
const NOISE_FRACTION = 0.001

/**
 * Computes a deterministic mid-price for the given material at the given
 * timestamp using a sinusoidal drift + small random noise.
 *
 * The sine wave is seeded from the material symbol so that XAU and XAG
 * are out of phase with each other (correlated but not identical).
 */
export function computeMidPrice(material: string, nowMs: number): number {
  const symbol = material.toUpperCase()
  const base = BASE_PRICES[symbol] ?? DEFAULT_BASE_PRICE

  // Phase offset per material — keeps symbols out of sync
  const phaseOffset =
    symbol
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0) * 0.1

  const sineValue = Math.sin(
    (2 * Math.PI * nowMs) / DRIFT_PERIOD_MS + phaseOffset
  )
  const drift = base * DRIFT_AMPLITUDE * sineValue

  // Small pseudo-random noise — seeded by truncated time bucket + material
  // so it changes every fetch interval but is reproducible for the same second
  const noiseSeed =
    Math.sin(
      Math.floor(nowMs / 1000) * 9301 +
        49297 +
        symbol.charCodeAt(0) * 233
    ) * 0.5 +
    0.5 // [0, 1]
  const noise = base * NOISE_FRACTION * (noiseSeed * 2 - 1) // [-noise, +noise]

  return Math.max(base + drift + noise, 0.01)
}

/**
 * Built-in random price provider.
 *
 * Generates ask/bid/price values for each requested material using a
 * time-correlated sinusoidal drift so prices change smoothly and
 * predictably over time — useful for development and testing.
 *
 * Prices are NOT truly random on each call; they follow a slow sine wave
 * so the storefront SSE stream shows realistic movement.
 */
export const randomProvider: PriceProviderFn = async (
  materials: string[]
): Promise<SpotPriceResult[]> => {
  const nowMs = Date.now()

  return materials.map((material) => {
    const mid = computeMidPrice(material, nowMs)
    const halfSpread = mid * SPREAD_FRACTION

    return {
      material: material.toUpperCase(),
      price: parseFloat(mid.toFixed(4)),
      ask: parseFloat((mid + halfSpread).toFixed(4)),
      bid: parseFloat((mid - halfSpread).toFixed(4)),
    }
  })
}
