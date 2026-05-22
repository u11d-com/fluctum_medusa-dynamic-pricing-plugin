import { shouldSkipFetch } from "../fetch-spot-prices"

const INTERVAL = 300 // 5 minutes

describe("shouldSkipFetch", () => {
  describe("when lastFetchedAt is null (never fetched)", () => {
    it("returns false — first run should always proceed", () => {
      expect(shouldSkipFetch(null, INTERVAL)).toBe(false)
    })
  })

  describe("when the interval has not elapsed", () => {
    it("returns true when only 1 second has passed", () => {
      const lastFetchedAt = Date.now() - 1_000
      expect(shouldSkipFetch(lastFetchedAt, INTERVAL)).toBe(true)
    })

    it("returns true when exactly (interval - 1) seconds have passed", () => {
      const now = 1_700_000_000_000
      const lastFetchedAt = now - (INTERVAL - 1) * 1_000
      expect(shouldSkipFetch(lastFetchedAt, INTERVAL, now)).toBe(true)
    })

    it("returns true for a short 10s cron tick well within a 300s interval", () => {
      const now = 1_700_000_000_000
      const lastFetchedAt = now - 10_000 // 10 seconds ago
      expect(shouldSkipFetch(lastFetchedAt, INTERVAL, now)).toBe(true)
    })
  })

  describe("when the interval has elapsed", () => {
    it("returns false when exactly the interval has elapsed", () => {
      const now = 1_700_000_000_000
      const lastFetchedAt = now - INTERVAL * 1_000
      expect(shouldSkipFetch(lastFetchedAt, INTERVAL, now)).toBe(false)
    })

    it("returns false when more than the interval has elapsed", () => {
      const now = 1_700_000_000_000
      const lastFetchedAt = now - (INTERVAL + 60) * 1_000
      expect(shouldSkipFetch(lastFetchedAt, INTERVAL, now)).toBe(false)
    })
  })

  describe("boundary: fetchIntervalSeconds = 10 (sub-60s, not rate-limited)", () => {
    it("still returns false when nothing has been fetched yet", () => {
      expect(shouldSkipFetch(null, 10)).toBe(false)
    })

    it("returns true if only 5 seconds have passed against a 10s interval", () => {
      const now = 1_700_000_000_000
      const lastFetchedAt = now - 5_000
      expect(shouldSkipFetch(lastFetchedAt, 10, now)).toBe(true)
    })

    it("returns false when 10 seconds have passed", () => {
      const now = 1_700_000_000_000
      const lastFetchedAt = now - 10_000
      expect(shouldSkipFetch(lastFetchedAt, 10, now)).toBe(false)
    })
  })
})
