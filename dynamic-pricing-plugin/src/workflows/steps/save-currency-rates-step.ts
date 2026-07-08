import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { DYNAMIC_PRICING_MODULE } from "../../modules/dynamic-pricing/index"
import type DynamicPricingModuleService from "../../modules/dynamic-pricing/service"
import { getPluginOptions } from "../../modules/dynamic-pricing/options-store"

export type SaveCurrencyRatesStepInput = Array<{ to: string; rate: number }>

export const saveCurrencyRatesStep = createStep(
  "save-currency-rates-step",
  async (input: SaveCurrencyRatesStepInput, { container }): Promise<StepResponse<void>> => {
    if (input.length === 0) return new StepResponse(undefined)
    const service = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
    const { pricingCurrency } = getPluginOptions()
    await service.bulkCreateRates(
      input.map((r) => ({
        from_currency: pricingCurrency,
        to_currency: r.to,
        rate: r.rate,
      }))
    )
    return new StepResponse(undefined)
  }
)
