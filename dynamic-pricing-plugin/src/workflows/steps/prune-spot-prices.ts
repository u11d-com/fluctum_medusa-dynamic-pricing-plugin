import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { DYNAMIC_PRICING_MODULE } from "../../modules/dynamic-pricing/index"
import type DynamicPricingModuleService from "../../modules/dynamic-pricing/service"

/**
 * Downsamples spot price history (see DynamicPricingModuleService.pruneSpotPrices).
 * No compensation: pruned history is intentionally not restorable.
 */
export const pruneSpotPricesStep = createStep(
  "prune-spot-prices-step",
  async (_input: void, { container }): Promise<StepResponse<number>> => {
    const service = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
    const deleted = await service.pruneSpotPrices()
    return new StepResponse(deleted)
  }
)
