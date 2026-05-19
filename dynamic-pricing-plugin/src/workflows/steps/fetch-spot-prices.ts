import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { getPluginOptions } from "../../modules/dynamic-pricing/options-store.js"
import type { SpotPriceResult } from "../../types.js"

export type FetchSpotPricesStepInput = {
  materials: string[]
}

/**
 * Calls the configured price provider and returns raw spot price results.
 */
export const fetchSpotPricesStep = createStep(
  "fetch-spot-prices-step",
  async (input: FetchSpotPricesStepInput): Promise<StepResponse<SpotPriceResult[]>> => {
    const options = getPluginOptions()
    const results = await options.provider(input.materials)
    return new StepResponse(results)
  }
)
