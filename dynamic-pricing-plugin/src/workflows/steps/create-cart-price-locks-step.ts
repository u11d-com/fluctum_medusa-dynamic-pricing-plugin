import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules, generateEntityId } from "@medusajs/framework/utils"
import { ICartModuleService, CartLineItemDTO } from "@medusajs/types"
import { LINK_TABLE, CartPriceLockRow } from "./link-table"
import { DYNAMIC_PRICING_MODULE } from "../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../modules/dynamic-pricing/service"
import { computeFinalPrice } from "../../utils/price-formula"
import { getPluginOptions } from "../../modules/dynamic-pricing/options-store"

type LineItemUpdate = {
  id: string
  unit_price: number
  is_custom_price: true
}

export type CreateCartPriceLocksStepInput = {
  cartId: string
  force?: boolean
}

type VariantPricingRow = {
  product_variant_id: string
  material: string
  weight_oz: number | null
  spread_factor: number
  spread_fixed: number
  premium_percentage: number
  premium_fixed: number
}

export const createCartPriceLocksStep = createStep(
  "create-cart-price-locks-step",
  async (input: CreateCartPriceLocksStepInput, { container }) => {
    const cartModule = container.resolve(Modules.CART) as ICartModuleService
    const pricingModule = container.resolve(DYNAMIC_PRICING_MODULE) as DynamicPricingModuleService
    const knex = pricingModule.getKnex()
    const options = getPluginOptions()

    const cart = await cartModule.retrieveCart(input.cartId, {
      relations: ["items"],
    })

    const items = (cart.items ?? []).filter((item: CartLineItemDTO) => item.variant_id)
    if (items.length === 0) {
      return new StepResponse({ locks: [], expires_at: new Date().toISOString() }, input.cartId)
    }

    if (!input.force) {
      const existingLocks: CartPriceLockRow[] = await knex("cart_price_lock")
        .where("cart_id", input.cartId)
        .where("expires_at", ">", new Date())
        .select("*")

      if (existingLocks.length > 0) {
        const lockVariantIds = new Set(existingLocks.map((r) => r.variant_id))
        const currentVariantIds = new Set(items.map((i) => i.variant_id!))

        if (
          lockVariantIds.size === currentVariantIds.size &&
          [...lockVariantIds].every((id) => currentVariantIds.has(id))
        ) {
          return new StepResponse(
            {
          locks: existingLocks.map((r) => ({
            variant_id: r.variant_id,
            unit_price: r.unit_price,
            quantity: r.quantity,
            material: r.material,
            currency_code: r.currency_code,
            conversion_rate: r.conversion_rate,
          })),
              expires_at: new Date(existingLocks[0].expires_at).toISOString(),
            },
            input.cartId
          )
        }
      }
    }

    const variantIds = items.map((item) => item.variant_id!)

    const pricingRows: VariantPricingRow[] = await knex(LINK_TABLE)
      .join("pricing_rule", `${LINK_TABLE}.pricing_rule_id`, "pricing_rule.id")
      .whereIn(`${LINK_TABLE}.product_variant_id`, variantIds)
      .whereNull(`${LINK_TABLE}.deleted_at`)
      .select(
        `${LINK_TABLE}.product_variant_id`,
        `${LINK_TABLE}.material`,
        `${LINK_TABLE}.weight_oz`,
        "pricing_rule.spread_factor",
        "pricing_rule.spread_fixed",
        "pricing_rule.premium_percentage",
        "pricing_rule.premium_fixed"
      )

    const pricingByVariantId = new Map<string, VariantPricingRow>()
    for (const row of pricingRows) {
      pricingByVariantId.set(row.product_variant_id, row)
    }

    const materials = [...new Set(pricingRows.map((r) => r.material))]
    const spotPrices = await pricingModule.getLatestSpotPrices(materials)
    const spotByMaterial = new Map(spotPrices.map((sp) => [sp.material, sp.price]))

    const now = new Date()
    const expiresAt = new Date(now.getTime() + options.priceLockDurationSeconds * 1000)

    // --- Currency conversion ---
    // CartDTO doesn't expose currency_code in its type declaration, but Medusa populates it at runtime.
    // Double-cast via unknown is the safe way to access undeclared runtime properties.
    const cartCurrency = (cart as unknown as Record<string, unknown>).currency_code as string | undefined ?? "USD"
    const pricingCurrency = options.pricingCurrency ?? "USD"

    let conversionRate = 1
    if (cartCurrency.toUpperCase() !== pricingCurrency.toUpperCase()) {
      const rates = await pricingModule.getLatestRates(pricingCurrency, [cartCurrency.toUpperCase()])
      const rateRow = rates.find((r) => r.to_currency.toUpperCase() === cartCurrency.toUpperCase())
      if (rateRow) {
        conversionRate = rateRow.rate
      } else if (options.currencyConversion !== null) {
        // currencyConversion is configured but no rate found for this currency → pricing error
        throw new Error(
          `No currency rate found for ${cartCurrency.toUpperCase()} (from ${pricingCurrency}). Ensure FX rates are seeded.`
        )
      }
      // else: currencyConversion is null (backward compat) → silently use rate=1
    }

    const rawNum = (v: number) => JSON.stringify({ value: String(v), precision: 20 })

    const lockRecords: Record<string, unknown>[] = []
    const lineItemUpdates: LineItemUpdate[] = []

    for (const item of items) {
      const pricing = pricingByVariantId.get(item.variant_id!)
      if (!pricing) continue

      const spotPrice = spotByMaterial.get(pricing.material)
      if (spotPrice === undefined) continue

      const weight = pricing.weight_oz ?? 0
      const unitPrice = computeFinalPrice({
        weight,
        spotPrice,
        spreadFactor: Number(pricing.spread_factor),
        spreadFixed: Number(pricing.spread_fixed),
        premiumPercentage: Number(pricing.premium_percentage),
        premiumFixed: Number(pricing.premium_fixed),
        currencyConversion: conversionRate,
      })

      lockRecords.push({
        id: generateEntityId(undefined, "cplock"),
        cart_id: input.cartId,
        variant_id: item.variant_id!,
        material: pricing.material,
        weight_oz: weight || null,
        raw_weight_oz: weight ? rawNum(weight) : null,
        unit_price: unitPrice,
        raw_unit_price: rawNum(unitPrice),
        quantity: Number(item.quantity),
        raw_quantity: rawNum(Number(item.quantity)),
        spot_price: spotPrice,
        raw_spot_price: rawNum(spotPrice),
        spread_factor: Number(pricing.spread_factor),
        raw_spread_factor: rawNum(Number(pricing.spread_factor)),
        spread_fixed: Number(pricing.spread_fixed),
        raw_spread_fixed: rawNum(Number(pricing.spread_fixed)),
        premium_percentage: Number(pricing.premium_percentage),
        raw_premium_percentage: rawNum(Number(pricing.premium_percentage)),
        premium_fixed: Number(pricing.premium_fixed),
        raw_premium_fixed: rawNum(Number(pricing.premium_fixed)),
        locked_at: now,
        expires_at: expiresAt,
        currency_code: cartCurrency.toUpperCase(),
        conversion_rate: conversionRate,
        raw_conversion_rate: rawNum(conversionRate),
      })

      lineItemUpdates.push({
        id: item.id,
        unit_price: unitPrice,
        is_custom_price: true,
      })
    }

    await knex("cart_price_lock").where("cart_id", input.cartId).delete()

    if (lockRecords.length > 0) {
      await knex.insert(lockRecords).into("cart_price_lock")
    }

    if (lineItemUpdates.length > 0) {
      await cartModule.updateLineItems(lineItemUpdates)
    }

    return new StepResponse(
      {
        locks: lockRecords.map((r) => ({
          variant_id: r.variant_id as string,
          unit_price: r.unit_price as number,
          quantity: r.quantity as number,
          material: r.material as string,
          currency_code: r.currency_code as string,
          conversion_rate: r.conversion_rate as number,
        })),
        expires_at: expiresAt.toISOString(),
      },
      input.cartId
    )
  },
  async (cartId: string, { container }) => {
    if (!cartId) return
    const service = container.resolve(DYNAMIC_PRICING_MODULE) as DynamicPricingModuleService
    await service.deleteCartPriceLocksByCart(cartId)
  }
)
