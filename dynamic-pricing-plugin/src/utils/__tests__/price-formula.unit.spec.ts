import { computeFinalPrice, PricingFactors } from "../price-formula"

const base: PricingFactors = {
  weight: 1,
  spotPrice: 2000,
  spreadFactor: 1,
  spreadFixed: 0,
  premiumPercentage: 0,
  premiumFixed: 0,
}

describe("computeFinalPrice", () => {
  describe("baseline (no adjustments)", () => {
    it("returns weight × spotPrice when all adjustments are neutral", () => {
      expect(computeFinalPrice(base)).toBe(2000)
    })

    it("scales linearly with weight", () => {
      expect(computeFinalPrice({ ...base, weight: 2 })).toBe(4000)
      expect(computeFinalPrice({ ...base, weight: 0.5 })).toBe(1000)
    })

    it("scales linearly with spotPrice", () => {
      expect(computeFinalPrice({ ...base, spotPrice: 3000 })).toBe(3000)
    })
  })

  describe("spreadFactor", () => {
    it("applies multiplicative spread factor", () => {
      // 1 oz × $2000 × 1.05 = $2100
      expect(computeFinalPrice({ ...base, spreadFactor: 1.05 })).toBeCloseTo(2100, 6)
    })

    it("spreadFactor of 2 doubles the price", () => {
      expect(computeFinalPrice({ ...base, spreadFactor: 2 })).toBe(4000)
    })
  })

  describe("spreadFixed", () => {
    it("adds a flat amount after spread factor", () => {
      // 1 × 2000 × 1 × (1 + 0) + 50 + 0 = 2050
      expect(computeFinalPrice({ ...base, spreadFixed: 50 })).toBe(2050)
    })

    it("is additive with premiumFixed", () => {
      expect(computeFinalPrice({ ...base, spreadFixed: 50, premiumFixed: 25 })).toBe(2075)
    })
  })

  describe("premiumPercentage", () => {
    it("applies percentage premium on top of spread-adjusted price", () => {
      // 1 × 2000 × 1 = 2000, +5% = 2100
      expect(computeFinalPrice({ ...base, premiumPercentage: 5 })).toBeCloseTo(2100, 6)
    })

    it("premium % compounds with spreadFactor", () => {
      // 1 × 2000 × 1.05 = 2100, +5% = 2205
      expect(computeFinalPrice({ ...base, spreadFactor: 1.05, premiumPercentage: 5 })).toBeCloseTo(2205, 6)
    })

    it("zero premiumPercentage has no effect", () => {
      expect(computeFinalPrice({ ...base, premiumPercentage: 0 })).toBe(2000)
    })
  })

  describe("premiumFixed", () => {
    it("adds a flat premium after percentage adjustments", () => {
      // 2000 × (1 + 5/100) + 100 = 2100 + 100 = 2200
      expect(computeFinalPrice({ ...base, premiumPercentage: 5, premiumFixed: 100 })).toBeCloseTo(2200, 6)
    })
  })

  describe("currencyConversion", () => {
    it("defaults to 1 (no conversion)", () => {
      expect(computeFinalPrice({ ...base })).toBe(
        computeFinalPrice({ ...base, currencyConversion: 1 })
      )
    })

    it("multiplies the base price before premium %", () => {
      // 1 × 2000 × 1 × 0.9 = 1800, +5% = 1890
      expect(computeFinalPrice({ ...base, currencyConversion: 0.9, premiumPercentage: 5 })).toBeCloseTo(1890, 6)
    })
  })

  describe("combined formula", () => {
    it("calculates correctly with all factors set", () => {
      // weight=2, spot=1800, factor=1.02, fixed=10, prem%=3, premFixed=5
      // base = 2 × 1800 × 1.02 = 3672
      // withPct = 3672 × 1.03 = 3782.16
      // final = 3782.16 + 10 + 5 = 3797.16
      const result = computeFinalPrice({
        weight: 2,
        spotPrice: 1800,
        spreadFactor: 1.02,
        spreadFixed: 10,
        premiumPercentage: 3,
        premiumFixed: 5,
      })
      expect(result).toBeCloseTo(3797.16, 2)
    })

    it("real-world 1oz gold coin: spot=$2000, 1% spread, $15 fixed premium", () => {
      // 1 × 2000 × 1.01 × (1 + 0) + 15 + 0 = 2020 + 15 = 2035
      expect(
        computeFinalPrice({
          weight: 1,
          spotPrice: 2000,
          spreadFactor: 1.01,
          spreadFixed: 15,
          premiumPercentage: 0,
          premiumFixed: 0,
        })
      ).toBeCloseTo(2035, 6)
    })
  })

  describe("edge cases", () => {
    it("zero weight produces zero base price (fixed costs still apply)", () => {
      expect(computeFinalPrice({ ...base, weight: 0, spreadFixed: 10, premiumFixed: 5 })).toBe(15)
    })

    it("zero spotPrice produces zero base price", () => {
      expect(computeFinalPrice({ ...base, spotPrice: 0, premiumFixed: 10 })).toBe(10)
    })
  })
})
