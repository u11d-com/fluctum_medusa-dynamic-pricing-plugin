import { LoaderOptions, MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { CartDTO, CartLineItemDTO } from "@medusajs/types"
import { resolvePluginOptions } from "../config"
import { setPluginOptions } from "../options-store"
import { DYNAMIC_PRICING_MODULE } from ".."
import { LINK_TABLE, CartPriceLockRow } from "../../../workflows/steps/link-table"
import DynamicPricingModuleService from "../service"

type ItemWithVariantId = CartLineItemDTO & { variant_id: string }

let hookRegistered = false

/**
 * Runs at startup.
 * 1. Validates plugin configuration and stores resolved options.
 * 2. Registers a validate hook on completeCartWorkflow that checks
 *    CartPriceLock validity before order placement.
 */
export default async function dynamicPricingLoader({
  container,
  options,
}: LoaderOptions) {
  const logger = container.resolve("logger")

  const resolved = resolvePluginOptions(options)

  setPluginOptions(resolved)

  logger.info(
    `[dynamic-pricing-plugin] Loaded. Materials: ${resolved.materials.join(", ")} | ` +
      `Fetch interval: ${resolved.fetchIntervalSeconds}s | ` +
      `Price lock duration: ${resolved.priceLockDurationSeconds}s | ` +
      `Provider: ${resolved.provider.name || "anonymous"}`
  )

  if (hookRegistered) return
  hookRegistered = true

  completeCartWorkflow.hooks.validate(
    async ({ input, cart }: { input: { id: string }; cart: CartDTO }, hookContainer: { container: MedusaContainer }) => {
      const service = hookContainer.container.resolve(DYNAMIC_PRICING_MODULE) as DynamicPricingModuleService
      const knex = service.getKnex()

      const locks = await knex("cart_price_lock")
        .where("cart_id", input.id)
        .whereNull("deleted_at")

      const now = new Date()

      const lockByVariant = new Map<string, CartPriceLockRow>()
      for (const lock of locks as CartPriceLockRow[]) {
        lockByVariant.set(lock.variant_id, lock)
      }

      const items = (cart.items ?? []).filter((i): i is ItemWithVariantId => i.variant_id != null)
      const variantIds = items.map((i) => i.variant_id)

      const linkVariants: { product_variant_id: string }[] = variantIds.length > 0
        ? await knex(LINK_TABLE)
            .select("product_variant_id")
            .whereIn("product_variant_id", variantIds)
            .whereNull("deleted_at")
        : []

      const linkedVariantSet = new Set(linkVariants.map((r) => r.product_variant_id))

      for (const item of items) {
        if (!linkedVariantSet.has(item.variant_id)) continue

        const lock = lockByVariant.get(item.variant_id)
        if (!lock) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Prices for this cart have not been locked. Please go back to checkout."
          )
        }

        if (new Date(lock.expires_at) < now) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Price lock has expired. Please refresh the checkout page to get current prices."
          )
        }
      }

      return new StepResponse(undefined)
    }
  )
}
