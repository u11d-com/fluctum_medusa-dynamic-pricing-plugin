import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { DYNAMIC_PRICING_MODULE } from "../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../modules/dynamic-pricing/service"

export type CreatePricingRuleStepInput = {
  name: string
  spread_factor?: number
  spread_fixed?: number
  premium_percentage?: number
  premium_fixed?: number
}

export const createPricingRuleStep = createStep(
  "create-pricing-rule",
  async (input: CreatePricingRuleStepInput, { container }) => {
    const service = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
    const rule = await service.createPricingRules(input)
    return new StepResponse(rule, rule.id)
  },
  async (id: string, { container }) => {
    const service = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
    await service.deletePricingRules(id)
  }
)
