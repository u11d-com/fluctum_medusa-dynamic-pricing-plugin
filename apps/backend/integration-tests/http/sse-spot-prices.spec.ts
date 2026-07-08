import { medusaIntegrationTestRunner } from "@medusajs/test-utils/dist/medusa-test-runner"
import { Modules } from "@medusajs/framework/utils"
import path from "path"

const CWD = path.resolve(__dirname, "../..")

jest.setTimeout(300_000)

const DYNAMIC_PRICING_MODULE = "dynamicPricing"

medusaIntegrationTestRunner({
  moduleName: "dynamic-pricing",
  cwd: CWD,
  disableAutoTeardown: true,
  testSuite: ({ api, getContainer }) => {
    let adminHeaders: Record<string, string>
    let storeHeaders: Record<string, string>

    beforeAll(async () => {
      const container = getContainer()

      const authService = container.resolve(Modules.AUTH)
      const workflowEngine = container.resolve(Modules.WORKFLOW_ENGINE)

      const { result: users } = await workflowEngine.run("create-users-workflow", {
        input: { users: [{ email: "sse-test@admin.com" }] },
      })
      const user = users[0]

      const { authIdentity } = await authService.register("emailpass", {
        body: { email: "sse-test@admin.com", password: "admin" },
      })

      if (!authIdentity) {
        throw new Error("Failed to create SSE test auth identity")
      }

      await authService.updateAuthIdentities({
        id: authIdentity.id,
        app_metadata: { user_id: user.id },
      })

      const tokenRes = await api.post("/auth/user/emailpass", {
        email: "sse-test@admin.com",
        password: "admin",
      })
      adminHeaders = { Authorization: `Bearer ${tokenRes.data.token}` }

      // Create a publishable API key for store requests
      const keyRes = await api.post(
        "/admin/api-keys",
        { title: "SSE Test Key", type: "publishable" },
        { headers: adminHeaders, validateStatus: () => true }
      )
      const publishableKey: string = keyRes.data.api_key.token
      storeHeaders = { "x-publishable-api-key": publishableKey }

      // Seed spot prices directly via module service
      const dpService = container.resolve(DYNAMIC_PRICING_MODULE)
      await dpService.createSpotPrices([
        { material: "XAU", price: 1900.12, ask: 1901.0, bid: 1899.5 },
        { material: "XAG", price: 23.45, ask: 23.5, bid: 23.4 },
      ])
    })

    // ── I. Store spot-prices endpoint ─────────────────────────────────────────

    describe("I. GET /store/dynamic-pricing/spot-prices", () => {
      it("returns spot_prices array", async () => {
        const res = await api.get("/store/dynamic-pricing/spot-prices", {
          headers: storeHeaders,
          validateStatus: () => true,
        })
        expect(res.status).toBe(200)
        expect(Array.isArray(res.data.spot_prices)).toBe(true)
      })

      it("each entry has material, price, ask, bid, timestamp fields", async () => {
        const res = await api.get("/store/dynamic-pricing/spot-prices", {
          headers: storeHeaders,
          validateStatus: () => true,
        })
        expect(res.status).toBe(200)
        expect(res.data.spot_prices.length).toBeGreaterThanOrEqual(2)
        res.data.spot_prices.forEach((sp: Record<string, unknown>) => {
          expect(typeof sp.material).toBe("string")
          expect(typeof sp.price).toBe("number")
          expect(typeof sp.ask).toBe("number")
          expect(typeof sp.bid).toBe("number")
          expect(typeof sp.timestamp).toBe("string")
          expect(isNaN(Date.parse(sp.timestamp as string))).toBe(false)
        })
      })

      it("filters by material (case-insensitive)", async () => {
        const res = await api.get(
          "/store/dynamic-pricing/spot-prices?material=xau",
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(res.status).toBe(200)
        expect(res.data.spot_prices.length).toBe(1)
        expect(res.data.spot_prices[0].material).toBe("XAU")
      })

      it("returns empty array for unknown material", async () => {
        const res = await api.get(
          "/store/dynamic-pricing/spot-prices?material=UNKNOWN",
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(res.status).toBe(200)
        expect(res.data.spot_prices).toEqual([])
      })

      it("returns 401 without publishable API key", async () => {
        const res = await api.get("/store/dynamic-pricing/spot-prices", {
          validateStatus: () => true,
        })
        // Medusa returns 400 when publishable API key header is missing
        expect([400, 401]).toContain(res.status)
      })
    })

    // ── II. Admin spot-prices endpoint ────────────────────────────────────────

    describe("II. GET /admin/dynamic-pricing/spot-prices", () => {
      it("returns spot_prices with count, limit, offset", async () => {
        const res = await api.get("/admin/dynamic-pricing/spot-prices", {
          headers: adminHeaders,
          validateStatus: () => true,
        })
        expect(res.status).toBe(200)
        expect(Array.isArray(res.data.spot_prices)).toBe(true)
        expect(typeof res.data.count).toBe("number")
        expect(typeof res.data.limit).toBe("number")
        expect(typeof res.data.offset).toBe("number")
      })

      it("respects limit and offset", async () => {
        const res = await api.get(
          "/admin/dynamic-pricing/spot-prices?limit=1&offset=0",
          { headers: adminHeaders, validateStatus: () => true }
        )
        expect(res.status).toBe(200)
        expect(res.data.spot_prices.length).toBeLessThanOrEqual(1)
        expect(res.data.limit).toBe(1)
        expect(res.data.offset).toBe(0)
      })

      it("filters by material query param", async () => {
        const res = await api.get(
          "/admin/dynamic-pricing/spot-prices?material=xag",
          { headers: adminHeaders, validateStatus: () => true }
        )
        expect(res.status).toBe(200)
        expect(res.data.spot_prices.length).toBeGreaterThanOrEqual(1)
        res.data.spot_prices.forEach((sp: Record<string, unknown>) => {
          expect(sp.material).toBe("XAG")
        })
      })

      it("returns 401 without admin auth", async () => {
        const res = await api.get("/admin/dynamic-pricing/spot-prices", {
          validateStatus: () => true,
        })
        expect(res.status).toBe(401)
      })
    })
  },
})
