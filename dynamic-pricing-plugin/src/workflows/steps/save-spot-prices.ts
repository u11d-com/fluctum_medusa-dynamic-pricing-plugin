import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { DYNAMIC_PRICING_MODULE } from "../../modules/dynamic-pricing/index"
import type DynamicPricingModuleService from "../../modules/dynamic-pricing/service"
import type { SpotPriceResult } from "../../types"
import sseManager from "../../utils/sse-manager"

export type SaveSpotPricesStepInput = {
  prices: SpotPriceResult[]
}

/**
 * Persists spot price results to the SpotPrice table and broadcasts
 * the new prices to all connected SSE clients.
 */
export const saveSpotPricesStep = createStep(
  "save-spot-prices-step",
  async (input: SaveSpotPricesStepInput, { container }): Promise<StepResponse<void>> => {
    const service = container.resolve<DynamicPricingModuleService>(
      DYNAMIC_PRICING_MODULE
    )

    const saved = await service.createSpotPrices(
      input.prices.map((p) => ({
        material: p.material,
        ask: p.ask,
        bid: p.bid,
        price: p.price,
      }))
    )

    // Broadcast using the DB-assigned created_at so the timestamp is accurate
    sseManager.broadcast(
      saved.map((sp) => ({
        material: sp.material,
        price: Number(sp.price),
        ask: Number(sp.ask),
        bid: Number(sp.bid),
        timestamp: new Date(sp.created_at).toISOString(),
      }))
    )

    return new StepResponse(undefined)
  }
)
