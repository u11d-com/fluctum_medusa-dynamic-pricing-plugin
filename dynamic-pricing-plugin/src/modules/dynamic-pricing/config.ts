import type {
  DynamicPricingOptions,
  ResolvedDynamicPricingOptions,
} from "../../types"

const DEFAULTS = {
  fetchIntervalSeconds: 10,
  pricingCurrency: "USD",
  currencyConversionRefreshIntervalSeconds: 3600,
  priceLockDurationSeconds: 120,
} as const

function isCurrencyCode(value: string): boolean {
  return /^[A-Za-z]{3}$/.test(value)
}

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
  options: unknown
): ResolvedDynamicPricingOptions {
  const opts = options as DynamicPricingOptions | null | undefined
  if (!opts) {
    throw new ConfigValidationError(
      "[dynamic-pricing-plugin] Plugin options are required."
    )
  }

  // Validate materials
  if (!Array.isArray(opts.materials) || opts.materials.length === 0) {
    throw new ConfigValidationError(
      "[dynamic-pricing-plugin] 'materials' must be a non-empty array of material symbols (e.g. [\"XAU\", \"XAG\"])."
    )
  }

  for (const mat of opts.materials) {
    if (typeof mat !== "string" || mat.trim() === "") {
      throw new ConfigValidationError(
        `[dynamic-pricing-plugin] Each material must be a non-empty string. Got: ${JSON.stringify(mat)}`
      )
    }
  }

  // Validate provider
  if (typeof opts.provider !== "function") {
    throw new ConfigValidationError(
      "[dynamic-pricing-plugin] 'provider' must be a function (PriceProviderFn)."
    )
  }

  // Validate pricingCurrency
  const pricingCurrency = opts.pricingCurrency ?? DEFAULTS.pricingCurrency
  if (typeof pricingCurrency !== "string" || !isCurrencyCode(pricingCurrency)) {
    throw new ConfigValidationError(
      `[dynamic-pricing-plugin] 'pricingCurrency' must be a 3-letter currency code. Got: ${pricingCurrency}`
    )
  }

  // Validate currencyConversion
  const currencyConversion = opts.currencyConversion
  let resolvedCurrencyConversion: ResolvedDynamicPricingOptions["currencyConversion"] = null
  if (currencyConversion !== undefined) {
    if (typeof currencyConversion !== "object" || currencyConversion === null) {
      throw new ConfigValidationError(
        "[dynamic-pricing-plugin] 'currencyConversion' must be an object when provided."
      )
    }

    if (typeof currencyConversion.provider !== "function") {
      throw new ConfigValidationError(
        "[dynamic-pricing-plugin] 'currencyConversion.provider' must be a function (CurrencyRateProviderFn)."
      )
    }

    const refreshIntervalSeconds =
      currencyConversion.refreshIntervalSeconds ??
      DEFAULTS.currencyConversionRefreshIntervalSeconds
    if (
      typeof refreshIntervalSeconds !== "number" ||
      !Number.isInteger(refreshIntervalSeconds) ||
      refreshIntervalSeconds < 60 ||
      refreshIntervalSeconds > 86400
    ) {
      throw new ConfigValidationError(
        `[dynamic-pricing-plugin] 'currencyConversion.refreshIntervalSeconds' must be an integer between 60 and 86400. Got: ${refreshIntervalSeconds}`
      )
    }

    if (
      !Array.isArray(currencyConversion.targetCurrencies) ||
      currencyConversion.targetCurrencies.length === 0
    ) {
      throw new ConfigValidationError(
        "[dynamic-pricing-plugin] 'currencyConversion.targetCurrencies' must be a non-empty array of 3-letter currency codes."
      )
    }

    const targetCurrencies = currencyConversion.targetCurrencies.map((currency) => {
      if (typeof currency !== "string" || !isCurrencyCode(currency)) {
        throw new ConfigValidationError(
          `[dynamic-pricing-plugin] Each 'currencyConversion.targetCurrencies' entry must be a 3-letter currency code. Got: ${JSON.stringify(currency)}`
        )
      }

      return currency.trim().toUpperCase()
    })

    resolvedCurrencyConversion = {
      provider: currencyConversion.provider,
      refreshIntervalSeconds,
      targetCurrencies,
    }
  }

  // Validate fetchIntervalSeconds
  const fetchIntervalSeconds =
    opts.fetchIntervalSeconds ?? DEFAULTS.fetchIntervalSeconds
  if (
    typeof fetchIntervalSeconds !== "number" ||
    !Number.isInteger(fetchIntervalSeconds) ||
    fetchIntervalSeconds < 1 ||
    fetchIntervalSeconds > 3600
  ) {
    throw new ConfigValidationError(
      `[dynamic-pricing-plugin] 'fetchIntervalSeconds' must be an integer between 1 and 3600. Got: ${fetchIntervalSeconds}`
    )
  }

  // Validate priceLockDurationSeconds
  const priceLockDurationSeconds =
    opts.priceLockDurationSeconds ?? DEFAULTS.priceLockDurationSeconds
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
    materials: opts.materials.map((m: string) => m.trim().toUpperCase()),
    fetchIntervalSeconds,
    priceLockDurationSeconds,
    provider: opts.provider,
    pricingCurrency: pricingCurrency.trim().toUpperCase(),
    currencyConversion: resolvedCurrencyConversion,
  }
}
