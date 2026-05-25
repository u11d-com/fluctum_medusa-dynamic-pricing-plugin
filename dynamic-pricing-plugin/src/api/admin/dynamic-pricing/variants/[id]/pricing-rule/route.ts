import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  assignVariantPricingRuleWorkflow,
  unassignVariantPricingRuleWorkflow,
  AssignVariantPricingRuleInput,
} from "../../../../../../workflows/variant-pricing-rule"
import { AssignVariantPricingRuleSchema } from "../../../../../middlewares"
import { DYNAMIC_PRICING_MODULE } from "../../../../../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../../../../../modules/dynamic-pricing/service"
import { getPluginOptions } from "../../../../../../modules/dynamic-pricing/options-store"
import { getLinkKnex, LINK_TABLE } from "../../../../../../workflows/steps/link-table"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id: variant_id } = req.params
  const service = req.scope.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
  const knex = getLinkKnex(req.scope)

  type LinkRow = { pricing_rule_id: string; material: string; weight_oz: number | null }
  const [linkRow] = await knex<LinkRow>(LINK_TABLE)
    .select("pricing_rule_id", "material", "weight_oz")
    .where({ product_variant_id: variant_id })
    .whereNull("deleted_at")
    .limit(1)

  if (!linkRow) {
    res.json({ pricing_rule: null })
    return
  }

  const [rule] = await service.listPricingRules({ id: linkRow.pricing_rule_id })
  res.json({
    pricing_rule: rule
      ? { ...rule, material: linkRow.material, weight_oz: linkRow.weight_oz ?? null }
      : null,
  })
}

export async function POST(
  req: MedusaRequest<AssignVariantPricingRuleSchema>,
  res: MedusaResponse
) {
  const { id: variant_id } = req.params
  const { pricing_rule_id, material, weight_oz } = req.validatedBody

  const { materials } = getPluginOptions()
  const upperMaterial = material.toUpperCase()
  if (!materials.includes(upperMaterial)) {
    res.status(400).json({
      message: `Invalid material "${upperMaterial}". Allowed: ${materials.join(", ")}`,
    })
    return
  }

  await assignVariantPricingRuleWorkflow(req.scope).run({
    input: {
      variant_id,
      pricing_rule_id,
      material: upperMaterial,
      weight_oz: weight_oz ?? null,
    } as AssignVariantPricingRuleInput,
  })

  res.status(201).json({ success: true })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id: variant_id } = req.params

  await unassignVariantPricingRuleWorkflow(req.scope).run({
    input: { variant_id },
  })

  res.json({ success: true })
}
