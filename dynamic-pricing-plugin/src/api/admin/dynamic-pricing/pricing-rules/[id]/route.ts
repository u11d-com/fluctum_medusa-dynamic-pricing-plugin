import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { DYNAMIC_PRICING_MODULE } from "../../../../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../../../../modules/dynamic-pricing/service"
import { deletePricingRuleWorkflow } from "../../../../../workflows/delete-pricing-rule"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const service = req.scope.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)

  const [rule] = await service.listPricingRules({ id })
  if (!rule) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `PricingRule ${id} not found`)
  }

  res.json({ pricing_rule: rule })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await deletePricingRuleWorkflow(req.scope).run({ input: { id } })

  res.json({ id, deleted: true })
}
