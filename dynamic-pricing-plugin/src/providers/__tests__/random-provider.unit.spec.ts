import { randomProvider, computeMidPrice } from "../random/index"

describe("computeMidPrice", () => {
  it("returns a positive number for known materials", () => {
    const price = computeMidPrice("XAU", Date.now())
    expect(price).toBeGreaterThan(0)
  })

  it("returns a positive number for unknown materials (uses default base)", () => {
    const price = computeMidPrice("UNKNOWN", Date.now())
    expect(price).toBeGreaterThan(0)
  })

  it("XAU base price is in the range [1000, 3000] (realistic gold range)", () => {
    const price = computeMidPrice("XAU", Date.now())
    expect(price).toBeGreaterThan(1000)
    expect(price).toBeLessThan(3000)
  })

  it("XAG base price is less than XAU (silver cheaper than gold)", () => {
    const now = Date.now()
    expect(computeMidPrice("XAG", now)).toBeLessThan(computeMidPrice("XAU", now))
  })

  it("is deterministic for the same timestamp and material", () => {
    const ts = 1700000000000
    expect(computeMidPrice("XAU", ts)).toBe(computeMidPrice("XAU", ts))
  })

  it("XAU and XAG produce different values at the same timestamp (phase offset)", () => {
    const ts = 1700000000000
    expect(computeMidPrice("XAU", ts)).not.toBe(computeMidPrice("XAG", ts))
  })

  it("prices drift smoothly — consecutive seconds differ by less than 1%", () => {
    const base = 1700000000000
    const p1 = computeMidPrice("XAU", base)
    const p2 = computeMidPrice("XAU", base + 10_000) // +10 seconds
    const changePct = Math.abs(p2 - p1) / p1
    expect(changePct).toBeLessThan(0.01) // less than 1% in 10 seconds
  })

  it("price is case-insensitive (normalised to uppercase internally)", () => {
    const ts = 1700000000000
    expect(computeMidPrice("xau", ts)).toBe(computeMidPrice("XAU", ts))
  })
})

describe("randomProvider", () => {
  it("returns one result per requested material", async () => {
    const results = await randomProvider(["XAU", "XAG"])
    expect(results).toHaveLength(2)
  })

  it("each result has the correct shape", async () => {
    const [result] = await randomProvider(["XAU"])
    expect(result).toHaveProperty("material")
    expect(result).toHaveProperty("price")
    expect(result).toHaveProperty("ask")
    expect(result).toHaveProperty("bid")
  })

  it("material in result is uppercased", async () => {
    const [result] = await randomProvider(["xau"])
    expect(result.material).toBe("XAU")
  })

  it("ask > bid (spread is positive)", async () => {
    const [result] = await randomProvider(["XAU"])
    expect(result.ask).toBeGreaterThan(result.bid)
  })

  it("price is between bid and ask", async () => {
    const [result] = await randomProvider(["XAU"])
    expect(result.price).toBeGreaterThanOrEqual(result.bid)
    expect(result.price).toBeLessThanOrEqual(result.ask)
  })

  it("all values are positive numbers", async () => {
    const results = await randomProvider(["XAU", "XAG"])
    for (const r of results) {
      expect(r.price).toBeGreaterThan(0)
      expect(r.ask).toBeGreaterThan(0)
      expect(r.bid).toBeGreaterThan(0)
    }
  })

  it("returns an empty array for empty materials list", async () => {
    const results = await randomProvider([])
    expect(results).toEqual([])
  })

  it("handles unknown material symbols gracefully", async () => {
    const [result] = await randomProvider(["UNOBTAINIUM"])
    expect(result.price).toBeGreaterThan(0)
    expect(result.material).toBe("UNOBTAINIUM")
  })
})
