import { medusaIntegrationTestRunner } from "@medusajs/test-utils/dist/medusa-test-runner"
import { Modules } from "@medusajs/framework/utils"
import path from "path"

const CWD = path.resolve(__dirname, "../..")

jest.setTimeout(300_000)

medusaIntegrationTestRunner({
  moduleName: "dynamic-pricing",
  cwd: CWD,
  disableAutoTeardown: true,
  testSuite: ({ api, getContainer }) => {
    let adminHeaders: Record<string, string>

    beforeAll(async () => {
      const container = getContainer()

      // Create admin user via services (same as `medusa user` CLI)
      const authService = container.resolve(Modules.AUTH)
      const workflowEngine = container.resolve(Modules.WORKFLOW_ENGINE)

      const { result: users } = await workflowEngine.run("create-users-workflow", {
        input: { users: [{ email: "admin@admin.com" }] },
      })
      const user = users[0]

      const { authIdentity } = await authService.register("emailpass", {
        body: { email: "admin@admin.com", password: "admin" },
      })

      if (!authIdentity) {
        throw new Error("Failed to create pricing-rules test auth identity")
      }

      await authService.updateAuthIdentities({
        id: authIdentity.id,
        app_metadata: { user_id: user.id },
      })

      // Get JWT token
      const tokenRes = await api.post("/auth/user/emailpass", {
        email: "admin@admin.com",
        password: "admin",
      })
      adminHeaders = { Authorization: `Bearer ${tokenRes.data.token}` }
    })

    async function adminPost(path: string, body: object) {
      return api.post(path, body, {
        headers: adminHeaders,
        validateStatus: () => true,
      })
    }

    async function adminGet(path: string) {
      return api.get(path, {
        headers: adminHeaders,
        validateStatus: () => true,
      })
    }

    async function adminDelete(path: string) {
      return api.delete(path, {
        headers: adminHeaders,
        validateStatus: () => true,
      })
    }

    async function createProduct(title: string, variants: { title: string }[]) {
      const res = await adminPost("/admin/products", {
        title,
        status: "published",
        options: [{ title: "Weight", values: variants.map((v) => v.title) }],
        variants: variants.map((v) => ({
          title: v.title,
          manage_inventory: false,
          options: { Weight: v.title },
          prices: [],
        })),
      })
      if (res.status !== 200) {
        throw new Error(`Failed to create product "${title}": ${res.status} ${JSON.stringify(res.data)}`)
      }
      // Fetch with variants included
      const withVariants = await adminGet(`/admin/products/${res.data.product.id}?fields=id,title,weight,*variants`)
      return withVariants.data.product
    }

    // ─────────────────────────────────────────────
    // I. Pricing Rules CRUD
    // ─────────────────────────────────────────────
    describe("I. Pricing Rules", () => {
      it("creates a pricing rule with defaults", async () => {
        const res = await adminPost("/admin/dynamic-pricing/pricing-rules", {
          name: "Gold Standard",
        })

        expect(res.status).toBe(201)
        const rule = res.data.pricing_rule
        expect(rule.id).toBeDefined()
        expect(rule.name).toBe("Gold Standard")
        expect(Number(rule.spread_factor)).toBe(1)
        expect(Number(rule.spread_fixed)).toBe(0)
        expect(Number(rule.premium_percentage)).toBe(0)
        expect(Number(rule.premium_fixed)).toBe(0)
      })

      it("creates a pricing rule with custom factors", async () => {
        const res = await adminPost("/admin/dynamic-pricing/pricing-rules", {
          name: "Silver Premium",
          spread_factor: 1.02,
          spread_fixed: 0.5,
          premium_percentage: 5,
          premium_fixed: 2,
        })

        expect(res.status).toBe(201)
        const rule = res.data.pricing_rule
        expect(rule.name).toBe("Silver Premium")
        expect(Number(rule.spread_factor)).toBeCloseTo(1.02)
        expect(Number(rule.spread_fixed)).toBeCloseTo(0.5)
        expect(Number(rule.premium_percentage)).toBeCloseTo(5)
        expect(Number(rule.premium_fixed)).toBeCloseTo(2)
      })

      it("lists pricing rules", async () => {
        await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Rule A" })
        await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Rule B" })

        const res = await adminGet("/admin/dynamic-pricing/pricing-rules")
        expect(res.status).toBe(200)
        expect(res.data.pricing_rules.length).toBeGreaterThanOrEqual(2)
        expect(res.data.count).toBeGreaterThanOrEqual(2)
      })

      it("returns 400 when name is missing", async () => {
        const res = await adminPost("/admin/dynamic-pricing/pricing-rules", {
          spread_factor: 1.1,
        })
        expect(res.status).toBe(400)
      })

      it("gets a single pricing rule by id", async () => {
        const createRes = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Lookup Me" })
        const ruleId = createRes.data.pricing_rule.id

        const res = await adminGet(`/admin/dynamic-pricing/pricing-rules/${ruleId}`)
        expect(res.status).toBe(200)
        expect(res.data.pricing_rule.id).toBe(ruleId)
        expect(res.data.pricing_rule.name).toBe("Lookup Me")
      })

      it("returns 404 for non-existent rule", async () => {
        const res = await adminGet("/admin/dynamic-pricing/pricing-rules/non-existent-id")
        expect(res.status).toBe(404)
      })

      it("deletes a pricing rule", async () => {
        const createRes = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Delete Me" })
        const ruleId = createRes.data.pricing_rule.id

        const deleteRes = await adminDelete(`/admin/dynamic-pricing/pricing-rules/${ruleId}`)
        expect(deleteRes.status).toBe(200)
        expect(deleteRes.data.deleted).toBe(true)

        const getRes = await adminGet(`/admin/dynamic-pricing/pricing-rules/${ruleId}`)
        expect(getRes.status).toBe(404)
      })
    })

    // ─────────────────────────────────────────────
    // II. Assign rule to single-variant product
    // ─────────────────────────────────────────────
    describe("II. Assign rule to single-variant product (2 oz gold coin)", () => {
      it("assigns a pricing rule to all variants via product endpoint", async () => {
        const ruleRes = await adminPost("/admin/dynamic-pricing/pricing-rules", {
          name: "Gold Coin Rule",
          spread_factor: 1.01,
        })
        const ruleId = ruleRes.data.pricing_rule.id

        // Create product (weight field is shipping weight in grams, irrelevant for pricing)
        const product = await createProduct("2 oz Gold Coin", [{ title: "Default" }])
        const variantId = product.variants[0].id

        // Assign rule via product endpoint (bulk-assigns all variants) with weight_oz
        const assignRes = await adminPost(
          `/admin/dynamic-pricing/products/${product.id}/pricing-rule`,
          { pricing_rule_id: ruleId, material: "XAU", weight_oz: 2 }
        )
        expect(assignRes.status).toBe(201)
        expect(assignRes.data.success).toBe(true)
        expect(assignRes.data.results[variantId]).toBe(true)

        // Verify link via variant GET — weight_oz must be returned
        const getRes = await adminGet(`/admin/dynamic-pricing/variants/${variantId}/pricing-rule`)
        expect(getRes.status).toBe(200)
        expect(getRes.data.pricing_rule.id).toBe(ruleId)
        expect(getRes.data.pricing_rule.material).toBe("XAU")
        expect(Number(getRes.data.pricing_rule.weight_oz)).toBeCloseTo(2)
      })
    })

    // ─────────────────────────────────────────────
    // III. Bulk-assign same rule to multi-variant product
    // ─────────────────────────────────────────────
    describe("III. Bulk-assign rule to multi-variant product (silver bar)", () => {
      it("assigns same rule to all variants via product endpoint", async () => {
        const ruleRes = await adminPost("/admin/dynamic-pricing/pricing-rules", {
          name: "Silver Bar Rule",
        })
        const ruleId = ruleRes.data.pricing_rule.id

        const product = await createProduct("Silver Bar", [
          { title: "1/2 oz" },
          { title: "1 oz" },
        ])
        const [v1, v2] = product.variants

        const assignRes = await adminPost(
          `/admin/dynamic-pricing/products/${product.id}/pricing-rule`,
          { pricing_rule_id: ruleId, material: "XAG" }
        )
        expect(assignRes.status).toBe(201)
        expect(assignRes.data.results[v1.id]).toBe(true)
        expect(assignRes.data.results[v2.id]).toBe(true)

        for (const variant of [v1, v2]) {
          const getRes = await adminGet(`/admin/dynamic-pricing/variants/${variant.id}/pricing-rule`)
          expect(getRes.status).toBe(200)
          expect(getRes.data.pricing_rule.id).toBe(ruleId)
          expect(getRes.data.pricing_rule.material).toBe("XAG")
        }
      })

      it("re-assigning the same product rule updates all variants without error", async () => {
        const rule1Res = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Old Rule" })
        const rule2Res = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "New Rule" })
        const rule1Id = rule1Res.data.pricing_rule.id
        const rule2Id = rule2Res.data.pricing_rule.id

        const product = await createProduct("Silver Bar 2", [
          { title: "2 oz" },
          { title: "5 oz" },
        ])
        const [v1, v2] = product.variants

        await adminPost(`/admin/dynamic-pricing/products/${product.id}/pricing-rule`, {
          pricing_rule_id: rule1Id, material: "XAG",
        })

        // Re-assign — must not throw "Cannot create multiple links"
        const reassignRes = await adminPost(`/admin/dynamic-pricing/products/${product.id}/pricing-rule`, {
          pricing_rule_id: rule2Id, material: "XAG",
        })
        expect(reassignRes.status).toBe(201)

        for (const variant of [v1, v2]) {
          const getRes = await adminGet(`/admin/dynamic-pricing/variants/${variant.id}/pricing-rule`)
          expect(getRes.data.pricing_rule.id).toBe(rule2Id)
        }
      })
    })

    // ─────────────────────────────────────────────
    // IV. Different rule per variant
    // ─────────────────────────────────────────────
    describe("IV. Different rule per variant (silver coin)", () => {
      it("assigns different rules to each variant individually", async () => {
        const rule10Res = await adminPost("/admin/dynamic-pricing/pricing-rules", {
          name: "10 oz Rule",
          premium_percentage: 3,
        })
        const rule15Res = await adminPost("/admin/dynamic-pricing/pricing-rules", {
          name: "15 oz Rule",
          premium_percentage: 5,
        })
        const rule10Id = rule10Res.data.pricing_rule.id
        const rule15Id = rule15Res.data.pricing_rule.id

        const { variants: [v10, v15] } = await createProduct("Silver Coin", [
          { title: "10 oz" },
          { title: "15 oz" },
        ])

        const assign10 = await adminPost(
          `/admin/dynamic-pricing/variants/${v10.id}/pricing-rule`,
          { pricing_rule_id: rule10Id, material: "XAG" }
        )
        expect(assign10.status).toBe(201)

        const assign15 = await adminPost(
          `/admin/dynamic-pricing/variants/${v15.id}/pricing-rule`,
          { pricing_rule_id: rule15Id, material: "XAG" }
        )
        expect(assign15.status).toBe(201)

        const get10 = await adminGet(`/admin/dynamic-pricing/variants/${v10.id}/pricing-rule`)
        expect(get10.data.pricing_rule.id).toBe(rule10Id)
        expect(Number(get10.data.pricing_rule.premium_percentage)).toBeCloseTo(3)

        const get15 = await adminGet(`/admin/dynamic-pricing/variants/${v15.id}/pricing-rule`)
        expect(get15.data.pricing_rule.id).toBe(rule15Id)
        expect(Number(get15.data.pricing_rule.premium_percentage)).toBeCloseTo(5)
      })

      it("re-assigning a variant rule does not affect sibling variant", async () => {
        const ruleARes = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Rule A" })
        const ruleBRes = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Rule B" })
        const ruleCRes = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Rule C" })
        const ruleAId = ruleARes.data.pricing_rule.id
        const ruleBId = ruleBRes.data.pricing_rule.id
        const ruleCId = ruleCRes.data.pricing_rule.id

        const { variants: [v1, v2] } = await createProduct("Silver Coin 2", [
          { title: "10 oz" },
          { title: "15 oz" },
        ])

        await adminPost(`/admin/dynamic-pricing/variants/${v1.id}/pricing-rule`, { pricing_rule_id: ruleAId, material: "XAG" })
        await adminPost(`/admin/dynamic-pricing/variants/${v2.id}/pricing-rule`, { pricing_rule_id: ruleBId, material: "XAG" })

        // Re-assign only v1
        await adminPost(`/admin/dynamic-pricing/variants/${v1.id}/pricing-rule`, { pricing_rule_id: ruleCId, material: "XAG" })

        const get1 = await adminGet(`/admin/dynamic-pricing/variants/${v1.id}/pricing-rule`)
        expect(get1.data.pricing_rule.id).toBe(ruleCId)

        // v2 must be untouched
        const get2 = await adminGet(`/admin/dynamic-pricing/variants/${v2.id}/pricing-rule`)
        expect(get2.data.pricing_rule.id).toBe(ruleBId)
      })
    })

    // ─────────────────────────────────────────────
    // V. Unassign and validation
    // ─────────────────────────────────────────────
    describe("V. Unassign and validation", () => {
      it("unassigns a pricing rule from a variant", async () => {
        const ruleRes = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Temporary Rule" })
        const ruleId = ruleRes.data.pricing_rule.id

        const { variants: [{ id: variantId }] } = await createProduct("Temp Product", [{ title: "1 oz" }])

        await adminPost(`/admin/dynamic-pricing/variants/${variantId}/pricing-rule`, {
          pricing_rule_id: ruleId, material: "XAU",
        })

        const deleteRes = await adminDelete(`/admin/dynamic-pricing/variants/${variantId}/pricing-rule`)
        expect(deleteRes.status).toBe(200)
        expect(deleteRes.data.success).toBe(true)

        const getRes = await adminGet(`/admin/dynamic-pricing/variants/${variantId}/pricing-rule`)
        expect(getRes.data.pricing_rule).toBeNull()
      })

      it("stores and returns weight_oz on the link", async () => {
        const ruleRes = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Weight Rule" })
        const ruleId = ruleRes.data.pricing_rule.id

        const { variants: [{ id: variantId }] } = await createProduct("Weight Test Product", [{ title: "1.5 oz" }])

        // Assign with weight_oz = 1.5
        const assignRes = await adminPost(`/admin/dynamic-pricing/variants/${variantId}/pricing-rule`, {
          pricing_rule_id: ruleId, material: "XAU", weight_oz: 1.5,
        })
        expect(assignRes.status).toBe(201)

        const getRes = await adminGet(`/admin/dynamic-pricing/variants/${variantId}/pricing-rule`)
        expect(getRes.data.pricing_rule).not.toBeNull()
        expect(getRes.data.pricing_rule.weight_oz).not.toBeNull()
        expect(Number(getRes.data.pricing_rule.weight_oz)).toBeCloseTo(1.5)

        // Re-assign with different weight_oz — must update
        const reassignRes = await adminPost(`/admin/dynamic-pricing/variants/${variantId}/pricing-rule`, {
          pricing_rule_id: ruleId, material: "XAU", weight_oz: 3,
        })
        expect(reassignRes.status).toBe(201)

        const getRes2 = await adminGet(`/admin/dynamic-pricing/variants/${variantId}/pricing-rule`)
        expect(Number(getRes2.data.pricing_rule.weight_oz)).toBeCloseTo(3)
      })

      it("allows assigning without weight_oz (null)", async () => {
        const ruleRes = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "No Weight Rule" })
        const ruleId = ruleRes.data.pricing_rule.id

        const { variants: [{ id: variantId }] } = await createProduct("No Weight Product", [{ title: "Default" }])

        await adminPost(`/admin/dynamic-pricing/variants/${variantId}/pricing-rule`, {
          pricing_rule_id: ruleId, material: "XAG",
        })

        const getRes = await adminGet(`/admin/dynamic-pricing/variants/${variantId}/pricing-rule`)
        expect(getRes.data.pricing_rule.weight_oz).toBeNull()
      })

      it("returns 400 for invalid material", async () => {
        const ruleRes = await adminPost("/admin/dynamic-pricing/pricing-rules", { name: "Rule" })

        const { variants: [{ id: variantId2 }] } = await createProduct("Product", [{ title: "1 oz" }])

        const res = await adminPost(
          `/admin/dynamic-pricing/variants/${variantId2}/pricing-rule`,
          { pricing_rule_id: ruleRes.data.pricing_rule.id, material: "INVALID" }
        )
        expect(res.status).toBe(400)
      })

      it("returns null for variant with no rule assigned", async () => {
        const { variants: [{ id: variantId3 }] } = await createProduct("No Rule Product", [{ title: "1 oz" }])

        const getRes = await adminGet(`/admin/dynamic-pricing/variants/${variantId3}/pricing-rule`)
        expect(getRes.status).toBe(200)
        expect(getRes.data.pricing_rule).toBeNull()
      })
    })
  },
})
