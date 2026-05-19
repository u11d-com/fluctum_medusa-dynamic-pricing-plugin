import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { DYNAMIC_PRICING_MODULE } from "../../modules/dynamic-pricing/index"
import type DynamicPricingModuleService from "../../modules/dynamic-pricing/service"
import type { SpotPriceResult } from "../../types"

export type SaveSpotPricesStepInput = {
  prices: SpotPriceResult[]
}

/**
 * Persists spot price results to the SpotPrice table.
 */
export const saveSpotPricesStep = createStep(
  "save-spot-prices-step",
  async (input: SaveSpotPricesStepInput, { container }): Promise<StepResponse<void>> => {
    const service = container.resolve<DynamicPricingModuleService>(
      DYNAMIC_PRICING_MODULE
    )

    await service.createSpotPrices(
      input.prices.map((p) => ({
        material: p.material,
        ask: p.ask,
        bid: p.bid,
        price: p.price,
      }))
    )

    return new StepResponse(undefined)
  }
)
