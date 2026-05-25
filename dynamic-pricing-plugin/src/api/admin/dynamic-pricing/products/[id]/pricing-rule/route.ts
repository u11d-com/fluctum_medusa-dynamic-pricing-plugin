import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"
import { BulkAssignProductPricingRuleSchema } from "../../../../../middlewares"
import { assignVariantPricingRuleWorkflow } from "../../../../../../workflows/variant-pricing-rule"
import { getPluginOptions } from "../../../../../../modules/dynamic-pricing/options-store"

export async function POST(
  req: MedusaRequest<BulkAssignProductPricingRuleSchema>,
  res: MedusaResponse
) {
  const { pricing_rule_id, material, weight_oz } = req.validatedBody

  const { materials } = getPluginOptions()
  const upperMaterial = material.toUpperCase()
  if (!materials.includes(upperMaterial)) {
    res.status(400).json({
      message: `Invalid material "${upperMaterial}". Allowed: ${materials.join(", ")}`,
    })
    return
  }

  // Fetch variants for this product from Medusa's product module
  const productModuleService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
  const [product] = await productModuleService.listProducts(
    { id: [req.params.id] },
    { relations: ["variants"] }
  )

  if (!product) {
    res.status(404).json({ message: "Product not found" })
    return
  }

  const results: Record<string, boolean> = {}
  for (const variant of product.variants ?? []) {
    await assignVariantPricingRuleWorkflow(req.scope).run({
      input: { variant_id: variant.id, pricing_rule_id, material: upperMaterial, weight_oz: weight_oz ?? null },
    })
    results[variant.id] = true
  }

  res.status(201).json({ success: true, results })
}
