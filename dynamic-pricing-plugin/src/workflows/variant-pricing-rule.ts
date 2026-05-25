import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { upsertVariantLinkStep } from "./steps/upsert-variant-link"
import { deleteVariantLinkStep } from "./steps/delete-variant-link"

export type AssignVariantPricingRuleInput = {
  variant_id: string
  pricing_rule_id: string
  material: string
  weight_oz: number | null
}

export const assignVariantPricingRuleWorkflow = createWorkflow(
  "assign-variant-pricing-rule",
  function (input: AssignVariantPricingRuleInput) {
    upsertVariantLinkStep(input)
    return new WorkflowResponse({ success: true })
  }
)

export type UnassignVariantPricingRuleInput = {
  variant_id: string
}

export const unassignVariantPricingRuleWorkflow = createWorkflow(
  "unassign-variant-pricing-rule",
  function (input: UnassignVariantPricingRuleInput) {
    deleteVariantLinkStep(input)
    return new WorkflowResponse({ success: true })
  }
)
