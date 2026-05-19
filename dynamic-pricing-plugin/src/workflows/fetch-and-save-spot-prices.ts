import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { fetchSpotPricesStep } from "./steps/fetch-spot-prices.js"
import { saveSpotPricesStep } from "./steps/save-spot-prices.js"

export type FetchAndSaveSpotPricesInput = {
  materials: string[]
}

/**
 * Fetches current spot prices from the configured provider
 * and persists them to the SpotPrice table.
 */
export const fetchAndSaveSpotPricesWorkflow = createWorkflow(
  "fetch-and-save-spot-prices",
  function (input: FetchAndSaveSpotPricesInput) {
    const prices = fetchSpotPricesStep({ materials: input.materials })
    saveSpotPricesStep({ prices })
    return new WorkflowResponse(prices)
  }
)
