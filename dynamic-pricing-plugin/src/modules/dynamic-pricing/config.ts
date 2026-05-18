import type {
  DynamicPricingOptions,
  ResolvedDynamicPricingOptions,
} from "../../types.js"

const DEFAULTS = {
  fetchIntervalSeconds: 10,
  priceLockDurationSeconds: 120,
} as const

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConfigValidationError"
  }
}

/**
 * Validates and resolves plugin options, applying defaults.
 * Throws ConfigValidationError for any invalid configuration.
 */
export function resolvePluginOptions(
  options: DynamicPricingOptions
): ResolvedDynamicPricingOptions {
  if (!options) {
    throw new ConfigValidationError(
      "[dynamic-pricing-plugin] Plugin options are required."
    )
  }

  // Validate materials
  if (!Array.isArray(options.materials) || options.materials.length === 0) {
    throw new ConfigValidationError(
      "[dynamic-pricing-plugin] 'materials' must be a non-empty array of material symbols (e.g. [\"XAU\", \"XAG\"])."
    )
  }

  for (const mat of options.materials) {
    if (typeof mat !== "string" || mat.trim() === "") {
      throw new ConfigValidationError(
        `[dynamic-pricing-plugin] Each material must be a non-empty string. Got: ${JSON.stringify(mat)}`
      )
    }
  }

  // Validate provider
  if (typeof options.provider !== "function") {
    throw new ConfigValidationError(
      "[dynamic-pricing-plugin] 'provider' must be a function (PriceProviderFn)."
    )
  }

  // Validate fetchIntervalSeconds
  const fetchIntervalSeconds =
    options.fetchIntervalSeconds ?? DEFAULTS.fetchIntervalSeconds
  if (
    typeof fetchIntervalSeconds !== "number" ||
    !Number.isInteger(fetchIntervalSeconds) ||
    fetchIntervalSeconds < 1
  ) {
    throw new ConfigValidationError(
      `[dynamic-pricing-plugin] 'fetchIntervalSeconds' must be a positive integer. Got: ${fetchIntervalSeconds}`
    )
  }

  // Validate priceLockDurationSeconds
  const priceLockDurationSeconds =
    options.priceLockDurationSeconds ?? DEFAULTS.priceLockDurationSeconds
  if (
    typeof priceLockDurationSeconds !== "number" ||
    !Number.isInteger(priceLockDurationSeconds) ||
    priceLockDurationSeconds < 1
  ) {
    throw new ConfigValidationError(
      `[dynamic-pricing-plugin] 'priceLockDurationSeconds' must be a positive integer. Got: ${priceLockDurationSeconds}`
    )
  }

  return {
    materials: options.materials.map((m) => m.trim().toUpperCase()),
    fetchIntervalSeconds,
    priceLockDurationSeconds,
    provider: options.provider,
  }
}
