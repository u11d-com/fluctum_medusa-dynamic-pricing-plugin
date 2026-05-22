import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DYNAMIC_PRICING_MODULE } from "../../../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../../../modules/dynamic-pricing/service"
import { createPricingRuleWorkflow } from "../../../../workflows/create-pricing-rule"
import { CreatePricingRuleSchema } from "../../../middlewares"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)

  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const offset = Number(req.query.offset) || 0

  const [rules, count] = await service.listAndCountPricingRules(
    {},
    { take: limit, skip: offset, order: { created_at: "DESC" } }
  )

  res.json({ pricing_rules: rules, count, limit, offset })
}

export async function POST(
  req: MedusaRequest<CreatePricingRuleSchema>,
  res: MedusaResponse
) {
  const { result } = await createPricingRuleWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json({ pricing_rule: result })
}
