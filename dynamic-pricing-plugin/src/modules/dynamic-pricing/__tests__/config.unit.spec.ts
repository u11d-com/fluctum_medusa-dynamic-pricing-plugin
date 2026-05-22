import {
  resolvePluginOptions,
  ConfigValidationError,
} from "../config"
import type { DynamicPricingOptions } from "../../../types"

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
})
