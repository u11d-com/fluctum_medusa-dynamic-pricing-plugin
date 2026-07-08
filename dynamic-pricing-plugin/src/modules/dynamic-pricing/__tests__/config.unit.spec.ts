import {
  resolvePluginOptions,
  ConfigValidationError,
} from "../config"
import type { DynamicPricingOptions, CurrencyRateProviderFn } from "../../../types"

const mockProvider: DynamicPricingOptions["provider"] = async (materials) =>
  materials.map((material) => ({ material, ask: 1, bid: 1, price: 1 }))

const validOptions: DynamicPricingOptions = {
  materials: ["XAU", "XAG"],
  provider: mockProvider,
}

// Helper that accepts deliberately invalid input for negative-path tests.
// The single cast here is intentional — it lets us test runtime validation
// without sprinkling `as any` throughout the test cases.
function resolveInvalid(opts: unknown) {
  return resolvePluginOptions(opts as DynamicPricingOptions)
}

describe("resolvePluginOptions", () => {
  describe("valid configuration", () => {
    it("accepts minimal valid options and applies defaults", () => {
      const result = resolvePluginOptions(validOptions)
      expect(result.materials).toEqual(["XAU", "XAG"])
      expect(result.fetchIntervalSeconds).toBe(10)
      expect(result.priceLockDurationSeconds).toBe(120)
      expect(result.provider).toBe(mockProvider)
    })

    it("accepts explicit overrides for all options", () => {
      const result = resolvePluginOptions({
        ...validOptions,
        fetchIntervalSeconds: 30,
        priceLockDurationSeconds: 60,
      })
      expect(result.fetchIntervalSeconds).toBe(30)
      expect(result.priceLockDurationSeconds).toBe(60)
    })

    it("normalises material symbols to uppercase and trims whitespace", () => {
      const result = resolvePluginOptions({
        ...validOptions,
        materials: [" xau ", "xag"],
      })
      expect(result.materials).toEqual(["XAU", "XAG"])
    })

    it("accepts a single material", () => {
      const result = resolvePluginOptions({ ...validOptions, materials: ["XAU"] })
      expect(result.materials).toEqual(["XAU"])
    })
  })

  describe("invalid materials", () => {
    it("throws when materials is missing", () => {
      expect(() =>
        resolveInvalid({ provider: mockProvider })
      ).toThrow(ConfigValidationError)
    })

    it("throws when materials is an empty array", () => {
      expect(() =>
        resolvePluginOptions({ ...validOptions, materials: [] })
      ).toThrow(ConfigValidationError)
    })

    it("throws when materials is not an array", () => {
      expect(() =>
        resolveInvalid({ ...validOptions, materials: "XAU" })
      ).toThrow(ConfigValidationError)
    })

    it("throws when a material entry is an empty string", () => {
      expect(() =>
        resolvePluginOptions({ ...validOptions, materials: ["XAU", ""] })
      ).toThrow(ConfigValidationError)
    })

    it("throws when a material entry is not a string", () => {
      expect(() =>
        resolveInvalid({ ...validOptions, materials: [123] })
      ).toThrow(ConfigValidationError)
    })
  })

  describe("invalid provider", () => {
    it("throws when provider is missing", () => {
      expect(() =>
        resolveInvalid({ materials: ["XAU"] })
      ).toThrow(ConfigValidationError)
    })

    it("throws when provider is not a function", () => {
      expect(() =>
        resolveInvalid({ ...validOptions, provider: "goldApi" })
      ).toThrow(ConfigValidationError)
    })
  })

  describe("invalid fetchIntervalSeconds", () => {
    it("throws when fetchIntervalSeconds is zero", () => {
      expect(() =>
        resolvePluginOptions({ ...validOptions, fetchIntervalSeconds: 0 })
      ).toThrow(ConfigValidationError)
    })

    it("throws when fetchIntervalSeconds is negative", () => {
      expect(() =>
        resolvePluginOptions({ ...validOptions, fetchIntervalSeconds: -5 })
      ).toThrow(ConfigValidationError)
    })

    it("throws when fetchIntervalSeconds is a float", () => {
      expect(() =>
        resolvePluginOptions({ ...validOptions, fetchIntervalSeconds: 1.5 })
      ).toThrow(ConfigValidationError)
    })
  })

  describe("invalid priceLockDurationSeconds", () => {
    it("throws when priceLockDurationSeconds is zero", () => {
      expect(() =>
        resolvePluginOptions({ ...validOptions, priceLockDurationSeconds: 0 })
      ).toThrow(ConfigValidationError)
    })

    it("throws when priceLockDurationSeconds is negative", () => {
      expect(() =>
        resolvePluginOptions({ ...validOptions, priceLockDurationSeconds: -1 })
      ).toThrow(ConfigValidationError)
    })
  })

  describe("pricingCurrency", () => {
    it("defaults to 'USD' when omitted", () => {
      const result = resolvePluginOptions(validOptions)
      expect(result.pricingCurrency).toBe("USD")
    })

    it("accepts an explicit 3-letter currency code", () => {
      const result = resolvePluginOptions({ ...validOptions, pricingCurrency: "EUR" })
      expect(result.pricingCurrency).toBe("EUR")
    })

    it("normalises lowercase to uppercase", () => {
      const result = resolvePluginOptions({ ...validOptions, pricingCurrency: "eur" })
      expect(result.pricingCurrency).toBe("EUR")
    })

    it("throws on non-string value", () => {
      expect(() => resolveInvalid({ ...validOptions, pricingCurrency: 123 })).toThrow(ConfigValidationError)
    })

    it("throws on 2-letter code", () => {
      expect(() => resolvePluginOptions({ ...validOptions, pricingCurrency: "US" })).toThrow(ConfigValidationError)
    })

    it("throws on 4-letter code", () => {
      expect(() => resolvePluginOptions({ ...validOptions, pricingCurrency: "USDD" })).toThrow(ConfigValidationError)
    })
  })

  describe("currencyConversion", () => {
    const mockRateProvider: CurrencyRateProviderFn = async (_from, tos) =>
      tos.map((to) => ({ to, rate: 1.5 }))

    const validConversion = {
      provider: mockRateProvider,
      targetCurrencies: ["EUR", "PLN"],
    }

    it("resolves to null when omitted", () => {
      const result = resolvePluginOptions(validOptions)
      expect(result.currencyConversion).toBeNull()
    })

    it("accepts a valid currencyConversion block", () => {
      const result = resolvePluginOptions({ ...validOptions, currencyConversion: validConversion })
      expect(result.currencyConversion).not.toBeNull()
      expect(result.currencyConversion?.provider).toBe(mockRateProvider)
      expect(result.currencyConversion?.refreshIntervalSeconds).toBe(3600)
      expect(result.currencyConversion?.targetCurrencies).toEqual(["EUR", "PLN"])
    })

    it("accepts explicit refreshIntervalSeconds", () => {
      const result = resolvePluginOptions({
        ...validOptions,
        currencyConversion: { ...validConversion, refreshIntervalSeconds: 600 },
      })
      expect(result.currencyConversion?.refreshIntervalSeconds).toBe(600)
    })

    it("normalises targetCurrencies to uppercase", () => {
      const result = resolvePluginOptions({
        ...validOptions,
        currencyConversion: { ...validConversion, targetCurrencies: ["eur", "pln"] },
      })
      expect(result.currencyConversion?.targetCurrencies).toEqual(["EUR", "PLN"])
    })

    it("throws when currencyConversion is not an object", () => {
      expect(() => resolveInvalid({ ...validOptions, currencyConversion: "static" })).toThrow(ConfigValidationError)
    })

    it("throws when currencyConversion.provider is missing", () => {
      expect(() =>
        resolveInvalid({ ...validOptions, currencyConversion: { targetCurrencies: ["EUR"] } })
      ).toThrow(ConfigValidationError)
    })

    it("throws when currencyConversion.provider is not a function", () => {
      expect(() =>
        resolveInvalid({ ...validOptions, currencyConversion: { ...validConversion, provider: "static" } })
      ).toThrow(ConfigValidationError)
    })

    it("throws when refreshIntervalSeconds is below 60", () => {
      expect(() =>
        resolvePluginOptions({
          ...validOptions,
          currencyConversion: { ...validConversion, refreshIntervalSeconds: 59 },
        })
      ).toThrow(ConfigValidationError)
    })

    it("throws when refreshIntervalSeconds exceeds 86400", () => {
      expect(() =>
        resolvePluginOptions({
          ...validOptions,
          currencyConversion: { ...validConversion, refreshIntervalSeconds: 86401 },
        })
      ).toThrow(ConfigValidationError)
    })

    it("throws when targetCurrencies is empty", () => {
      expect(() =>
        resolvePluginOptions({
          ...validOptions,
          currencyConversion: { ...validConversion, targetCurrencies: [] },
        })
      ).toThrow(ConfigValidationError)
    })

    it("throws when a targetCurrencies entry is invalid", () => {
      expect(() =>
        resolveInvalid({
          ...validOptions,
          currencyConversion: { ...validConversion, targetCurrencies: ["EURO"] },
        })
      ).toThrow(ConfigValidationError)
    })
  })
})
