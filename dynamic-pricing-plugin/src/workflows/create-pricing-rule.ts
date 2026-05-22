import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createPricingRuleStep, CreatePricingRuleStepInput } from "./steps/create-pricing-rule"

export const createPricingRuleWorkflow = createWorkflow(
  "create-pricing-rule",
  function (input: CreatePricingRuleStepInput) {
    const rule = createPricingRuleStep(input)
    return new WorkflowResponse(rule)
  }
)
