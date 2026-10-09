import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { pruneSpotPricesStep } from "./steps/prune-spot-prices"

export const pruneSpotPricesWorkflow = createWorkflow(
  "prune-spot-prices",
  function () {
    const deleted = pruneSpotPricesStep()
    return new WorkflowResponse(deleted)
  }
)
