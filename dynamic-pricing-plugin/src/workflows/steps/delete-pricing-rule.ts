import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { DYNAMIC_PRICING_MODULE } from "../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../modules/dynamic-pricing/service"

export type DeletePricingRuleStepInput = {
  id: string
}

type PricingRuleSnapshot = {
  id: string
  name: string
  spread_factor: number
  spread_fixed: number
  premium_percentage: number
  premium_fixed: number
}

export const deletePricingRuleStep = createStep(
  "delete-pricing-rule",
  async (input: DeletePricingRuleStepInput, { container }) => {
    const service = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)

    const [rule] = await service.listPricingRules({ id: input.id })
    if (!rule) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `PricingRule ${input.id} not found`)
    }

    const snapshot: PricingRuleSnapshot = {
      id: rule.id,
      name: rule.name,
      spread_factor: Number(rule.spread_factor),
      spread_fixed: Number(rule.spread_fixed),
      premium_percentage: Number(rule.premium_percentage),
      premium_fixed: Number(rule.premium_fixed),
    }

    await service.deletePricingRules(input.id)
    return new StepResponse({ id: input.id }, snapshot)
  },
  async (snapshot: PricingRuleSnapshot, { container }) => {
    const service = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
    await service.createPricingRules(snapshot)
  }
)
