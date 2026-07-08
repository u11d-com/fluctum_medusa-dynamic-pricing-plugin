import { medusaIntegrationTestRunner } from "@medusajs/test-utils/dist/medusa-test-runner"
import { Modules, ContainerRegistrationKeys, ModuleRegistrationName, generateEntityId } from "@medusajs/framework/utils"
import {
  createStockLocationsWorkflow,
  createShippingOptionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import path from "path"

const CWD = path.resolve(__dirname, "../..")

jest.setTimeout(300_000)

medusaIntegrationTestRunner({
  moduleName: "dynamic-pricing",
  cwd: CWD,
  disableAutoTeardown: true,
  testSuite: ({ api, getContainer }) => {
    let adminHeaders: Record<string, string>
    let storeHeaders: Record<string, string>
    let regionId: string
    let salesChannelId: string
    let variantId: string
    let ruleId: string
    let cartId: string

    let stockLocationId: string
    let shippingOptionName = "Standard Shipping"

    beforeAll(async () => {
      const container = getContainer()

      const authService = container.resolve(Modules.AUTH)
      const workflowEngine = container.resolve(Modules.WORKFLOW_ENGINE)

      const { result: users } = await workflowEngine.run("create-users-workflow", {
        input: { users: [{ email: "checkout-test@admin.com" }] },
      })
      const user = users[0]

      const { authIdentity } = await authService.register("emailpass", {
        body: { email: "checkout-test@admin.com", password: "admin" },
      })

      if (!authIdentity) {
        throw new Error("Failed to create checkout test auth identity")
      }

      await authService.updateAuthIdentities({
        id: authIdentity.id,
        app_metadata: { user_id: user.id },
      })

      const tokenRes = await api.post("/auth/user/emailpass", {
        email: "checkout-test@admin.com",
        password: "admin",
      })
      adminHeaders = { Authorization: `Bearer ${tokenRes.data.token}` }

      // Create a publishable API key for store requests
      const keyRes = await api.post(
        "/admin/api-keys",
        { title: "Checkout Test Key", type: "publishable" },
        { headers: adminHeaders, validateStatus: () => true }
      )
      const publishableKey: string = keyRes.data.api_key.token
      storeHeaders = { "x-publishable-api-key": publishableKey }

      // ── Fulfillment infrastructure ──────────────────────────────────────

      const link = container.resolve(ContainerRegistrationKeys.LINK)
      const fulfillmentModule = container.resolve(ModuleRegistrationName.FULFILLMENT)

      // Create stock location
      const { result: slResult } = await createStockLocationsWorkflow(container).run({
        input: {
          locations: [{
            name: `Test Warehouse ${Date.now()}`,
            address: { city: "Testville", country_code: "us", address_1: "" },
          }],
        },
      })
      stockLocationId = slResult[0].id

      // Link stock location → fulfillment provider
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
      })

      // Create fulfillment set with service zone covering US
      const fulfillmentSet = await fulfillmentModule.createFulfillmentSets({
        name: `Test Delivery ${Date.now()}`,
        type: "shipping",
        service_zones: [{
          name: "US",
          geo_zones: [{ country_code: "us", type: "country" }],
        }],
      })

      // Link stock location → fulfillment set
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
        [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
      })

      // Create a shipping profile
      const profileRes = await api.post(
        "/admin/shipping-profiles",
        { name: "Test Shipping Profile", type: "default" },
        { headers: adminHeaders, validateStatus: () => true }
      )
      const shippingProfileId = profileRes.data.shipping_profile.id
      const serviceZoneId = fulfillmentSet.service_zones[0].id

      // Create shipping options
      await createShippingOptionsWorkflow(container).run({
        input: [{
          name: shippingOptionName,
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfileId,
          type: { label: "Standard", description: "Ship in 2-3 days.", code: "standard" },
          prices: [{ currency_code: "usd", amount: 10 }],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        }],
      })
    })

    beforeEach(async () => {
      const ts = Date.now()

      // Create a region
      const regionRes = await api.post(
        "/admin/regions",
        { name: `US-${ts}`, currency_code: "usd", countries: ["us"] },
        { headers: adminHeaders, validateStatus: () => true }
      )
      regionId = regionRes.data.region?.id || regionRes.data.id

      // Get or create a sales channel
      const scRes = await api.get("/admin/sales-channels", {
        headers: adminHeaders,
        validateStatus: () => true,
      })
      if (scRes.data.sales_channels?.length > 0) {
        salesChannelId = scRes.data.sales_channels[0].id
      } else {
        const newSc = await api.post(
          "/admin/sales-channels",
          { name: "Default", description: "Default SC" },
          { headers: adminHeaders, validateStatus: () => true }
        )
        salesChannelId = newSc.data.sales_channel.id
      }

      // Link stock location → sales channel
      const container = getContainer()
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: { id: stockLocationId, add: [salesChannelId] },
      })

      // Create a pricing rule
      const ruleRes = await api.post(
        "/admin/dynamic-pricing/pricing-rules",
        { name: `Test Gold Rule ${ts}`, spread_factor: 1.02, premium_percentage: 0.5 },
        { headers: adminHeaders, validateStatus: () => true }
      )
      ruleId = ruleRes.data.pricing_rule.id

      // Create a product with a variant
      const prodRes = await api.post(
        "/admin/products",
        {
          title: `Test Gold Coin ${ts}`,
          status: "published",
          options: [{ title: "Weight", values: ["1 oz"] }],
          variants: [{
            title: "1 oz",
            manage_inventory: false,
            options: { Weight: "1 oz" },
            prices: [{ amount: 1, currency_code: "usd" }],
          }],
        },
        { headers: adminHeaders, validateStatus: () => true }
      )
      const productId = prodRes.data.product.id

      // Fetch product with variants
      const prodWithVariants = await api.get(
        `/admin/products/${productId}?fields=id,title,*variants`,
        { headers: adminHeaders, validateStatus: () => true }
      )
      variantId = prodWithVariants.data.product.variants[0].id

      // Assign pricing rule to variant
      await api.post(
        `/admin/dynamic-pricing/variants/${variantId}/pricing-rule`,
        { pricing_rule_id: ruleId, material: "XAU", weight_oz: 1 },
        { headers: adminHeaders, validateStatus: () => true }
      )

      // Seed a spot price for XAU
      const dpService = getContainer().resolve("dynamicPricing")
      await dpService.createSpotPrices([
        { material: "XAU", price: 2000, ask: 2001, bid: 1999 },
      ])

      // Create a cart
      const cartRes = await api.post(
        "/store/carts",
        { region_id: regionId, sales_channel_id: salesChannelId, currency_code: "usd" },
        { headers: storeHeaders, validateStatus: () => true }
      )
      cartId = cartRes.data.cart.id

      // Add line item to cart
      await api.post(
        `/store/carts/${cartId}/line-items`,
        { variant_id: variantId, quantity: 2 },
        { headers: storeHeaders, validateStatus: () => true }
      )
    })

    // ── I. Price lock endpoint ─────────────────────────────────────────────────

    describe("I. POST /store/dynamic-pricing/carts/:id/price-lock", () => {
      it("locks prices and returns lock info", async () => {
        const res = await api.post(
          `/store/dynamic-pricing/carts/${cartId}/price-lock`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(res.status).toBe(200)
        expect(res.data.locks).toBeDefined()
        expect(Array.isArray(res.data.locks)).toBe(true)
        expect(res.data.locks.length).toBe(1)
        expect(res.data.locks[0].variant_id).toBe(variantId)
        expect(typeof res.data.locks[0].unit_price).toBe("number")
        expect(res.data.locks[0].unit_price).toBeGreaterThan(0)
        expect(typeof res.data.expires_at).toBe("string")
        expect(res.data.locks[0].currency_code).toBe("USD")
        expect(typeof res.data.locks[0].conversion_rate).toBe("number")
        expect(res.data.locks[0].conversion_rate).toBe(1)
      })

      it("recalculates prices on each call (fresh spot prices)", async () => {
        await api.post(
          `/store/dynamic-pricing/carts/${cartId}/price-lock`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        // Seed a different spot price via raw knex
        const dpService = getContainer().resolve("dynamicPricing")
        const knex = dpService.getKnex()
        const raw = (v: number) => ({ value: String(v), precision: 20 })
        await knex("spot_price").insert({
          id: generateEntityId("", "sppt"),
          material: "XAU",
          price: 2100,
          ask: 2101,
          bid: 2099,
          raw_price: raw(2100),
          raw_ask: raw(2101),
          raw_bid: raw(2099),
          created_at: new Date(),
          updated_at: new Date(),
        })

        const res = await api.post(
          `/store/dynamic-pricing/carts/${cartId}/price-lock?force=true`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(res.status).toBe(200)
        expect(res.data.locks[0].unit_price).toBeCloseTo(
          1 * 2100 * 1.02 * (1 + 0.5 / 100),
          0
        )
      })

      it("returns empty locks for cart with no items", async () => {
        const emptyCartRes = await api.post(
          "/store/carts",
          { region_id: regionId, sales_channel_id: salesChannelId, currency_code: "usd" },
          { headers: storeHeaders, validateStatus: () => true }
        )
        const emptyCartId = emptyCartRes.data.cart.id

        const res = await api.post(
          `/store/dynamic-pricing/carts/${emptyCartId}/price-lock`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(res.status).toBe(200)
        expect(res.data.locks).toEqual([])
      })

      it("requires publishable API key", async () => {
        const res = await api.post(
          `/store/dynamic-pricing/carts/${cartId}/price-lock`,
          {},
          { validateStatus: () => true }
        )
        expect([400, 401]).toContain(res.status)
      })

      it("applies currency conversion for non-pricing-currency cart", async () => {
        // Seed a PLN rate
        const dpService = getContainer().resolve("dynamicPricing")
        const knex = dpService.getKnex()
        const rawNum = (v: number) => JSON.stringify({ value: String(v), precision: 20 })
        const plnRate = 4.0
        await knex("currency_rate").insert({
          id: generateEntityId(undefined, "crate"),
          from_currency: "USD",
          to_currency: "PLN",
          rate: plnRate,
          raw_rate: rawNum(plnRate),
          created_at: new Date(),
          updated_at: new Date(),
        })

        // Create a PLN cart
        const ts = Date.now()
        const plnRegionRes = await api.post(
          "/admin/regions",
          { name: `Poland-${ts}`, currency_code: "pln", countries: ["pl"] },
          { headers: adminHeaders, validateStatus: () => true }
        )
        const plnRegionId = plnRegionRes.data.region?.id || plnRegionRes.data.id

        const plnCartRes = await api.post(
          "/store/carts",
          { region_id: plnRegionId, sales_channel_id: salesChannelId, currency_code: "pln" },
          { headers: storeHeaders, validateStatus: () => true }
        )
        const plnCartId = plnCartRes.data.cart.id

        await api.post(
          `/store/carts/${plnCartId}/line-items`,
          { variant_id: variantId, quantity: 1 },
          { headers: storeHeaders, validateStatus: () => true }
        )

        const res = await api.post(
          `/store/dynamic-pricing/carts/${plnCartId}/price-lock`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(res.status).toBe(200)
        expect(res.data.locks.length).toBe(1)
        const lock = res.data.locks[0]
        expect(lock.currency_code).toBe("PLN")
        expect(lock.conversion_rate).toBeCloseTo(plnRate, 3)
        // unit_price should be spot * spread * conversionRate
        expect(lock.unit_price).toBeGreaterThan(0)
      })
    })

    // ── II. Cart completion with price lock ────────────────────────────────────

    describe("II. Cart completion with price lock", () => {
      it("completes cart successfully with valid price lock", async () => {
        // Lock prices first
        await api.post(
          `/store/dynamic-pricing/carts/${cartId}/price-lock`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        // Create payment collection for the cart
        const pcRes = await api.post(
          "/store/payment-collections",
          { cart_id: cartId },
          { headers: storeHeaders, validateStatus: () => true }
        )
        const paymentCollectionId = pcRes.data.payment_collection.id

        // Initialize a payment session
        await api.post(
          `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
          { provider_id: "pp_system_default" },
          { headers: storeHeaders, validateStatus: () => true }
        )

        const completeRes = await api.post(
          `/store/carts/${cartId}/complete`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(completeRes.status).toBe(200)
        expect(completeRes.data.type).toBe("order")
        expect(completeRes.data.order.id).toBeDefined()
      })

      it("rejects cart completion without price lock", async () => {
        const completeRes = await api.post(
          `/store/carts/${cartId}/complete`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(completeRes.status).toBe(400)
        expect(completeRes.data).toBeDefined()
      })

      it("rejects cart completion after lock expires", async () => {
        await api.post(
          `/store/dynamic-pricing/carts/${cartId}/price-lock`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        // Set expires_at to the past
        const dpService = getContainer().resolve("dynamicPricing")
        const knex = dpService.getKnex()
        await knex("cart_price_lock")
          .where("cart_id", cartId)
          .update({ expires_at: new Date(Date.now() - 60000) })

        const completeRes = await api.post(
          `/store/carts/${cartId}/complete`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(completeRes.status).toBe(400)
      })
    })

    // ── III. Full checkout flow (storefront mirror) ────────────────────────────

    describe("III. Full checkout flow — storefront mirror", () => {
      it("completes the full storefront flow with address → shipping → payment → lock → order", async () => {
        // 1. Set shipping address and email
        await api.post(
          `/store/carts/${cartId}`,
          {
            email: "customer@test.com",
            shipping_address: {
              address_1: "123 Main St",
              city: "New York",
              country_code: "us",
              postal_code: "10001",
            },
          },
          { headers: storeHeaders, validateStatus: () => true }
        )

        // 2. List available shipping options
        const optionsRes = await api.get(
          `/store/shipping-options?cart_id=${cartId}`,
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(optionsRes.status).toBe(200)
        expect(optionsRes.data.shipping_options.length).toBeGreaterThanOrEqual(1)

        const shippingOptionId = optionsRes.data.shipping_options[0].id
        expect(shippingOptionId).toBeDefined()

        // 3. Add shipping method to cart
        await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: shippingOptionId, data: {} },
          { headers: storeHeaders, validateStatus: () => true }
        )

        // 4. Create payment collection
        const pcRes = await api.post(
          "/store/payment-collections",
          { cart_id: cartId },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(pcRes.status).toBe(200)
        const paymentCollectionId = pcRes.data.payment_collection.id

        // 5. Initialize payment session
        await api.post(
          `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
          { provider_id: "pp_system_default" },
          { headers: storeHeaders, validateStatus: () => true }
        )

        // 6. Lock prices (as storefront does on every checkout page render + placeOrder)
        const lockRes = await api.post(
          `/store/dynamic-pricing/carts/${cartId}/price-lock`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(lockRes.status).toBe(200)
        expect(lockRes.data.locks.length).toBe(1)

        // 7. Complete the cart
        const completeRes = await api.post(
          `/store/carts/${cartId}/complete`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(completeRes.status).toBe(200)
        expect(completeRes.data.type).toBe("order")
        expect(completeRes.data.order.id).toBeDefined()
        expect(completeRes.data.order.items?.length).toBe(1)
        expect(completeRes.data.order.shipping_address).toBeDefined()
      })

      it("rejects completion when price lock is skipped (full flow without lock)", async () => {
        // 1. Set shipping address and email
        await api.post(
          `/store/carts/${cartId}`,
          {
            email: "customer@test.com",
            shipping_address: {
              address_1: "456 Oak Ave",
              city: "Los Angeles",
              country_code: "us",
              postal_code: "90001",
            },
          },
          { headers: storeHeaders, validateStatus: () => true }
        )

        // 2. List shipping options
        const optionsRes = await api.get(
          `/store/shipping-options?cart_id=${cartId}`,
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(optionsRes.status).toBe(200)
        const shippingOptionId = optionsRes.data.shipping_options[0].id

        // 3. Add shipping method
        await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: shippingOptionId, data: {} },
          { headers: storeHeaders, validateStatus: () => true }
        )

        // 4. Create payment collection
        const pcRes = await api.post(
          "/store/payment-collections",
          { cart_id: cartId },
          { headers: storeHeaders, validateStatus: () => true }
        )
        const paymentCollectionId = pcRes.data.payment_collection.id

        // 5. Initialize payment session (skip price lock)
        await api.post(
          `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
          { provider_id: "pp_system_default" },
          { headers: storeHeaders, validateStatus: () => true }
        )

        // 6. Complete cart WITHOUT price lock → should reject
        const completeRes = await api.post(
          `/store/carts/${cartId}/complete`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(completeRes.status).toBe(400)
        expect(completeRes.data.message || completeRes.data.errors).toBeDefined()
      })
    })
  },
})
