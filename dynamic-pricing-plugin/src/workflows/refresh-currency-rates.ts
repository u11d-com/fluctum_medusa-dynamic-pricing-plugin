import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { fetchCurrencyRatesStep } from "./steps/fetch-currency-rates-step"
import { saveCurrencyRatesStep } from "./steps/save-currency-rates-step"

export const refreshCurrencyRatesWorkflow = createWorkflow(
  "refresh-currency-rates",
  function () {
    const rates = fetchCurrencyRatesStep()
    saveCurrencyRatesStep(rates)
    return new WorkflowResponse(rates)
  }
)
