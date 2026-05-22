import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deletePricingRuleStep, DeletePricingRuleStepInput } from "./steps/delete-pricing-rule"

export const deletePricingRuleWorkflow = createWorkflow(
  "delete-pricing-rule",
  function (input: DeletePricingRuleStepInput) {
    const result = deletePricingRuleStep(input)
    return new WorkflowResponse(result)
  }
)
