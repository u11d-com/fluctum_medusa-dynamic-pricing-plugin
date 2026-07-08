import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { getPluginOptions } from "../../modules/dynamic-pricing/options-store"

export type FetchCurrencyRatesStepOutput = Array<{ to: string; rate: number }>

export const fetchCurrencyRatesStep = createStep(
  "fetch-currency-rates-step",
  async (): Promise<StepResponse<FetchCurrencyRatesStepOutput>> => {
    const options = getPluginOptions()
    if (!options.currencyConversion) {
      return new StepResponse([])
    }
    const { provider, targetCurrencies } = options.currencyConversion
    const results = await provider(options.pricingCurrency, targetCurrencies)
    return new StepResponse(results)
  }
)
