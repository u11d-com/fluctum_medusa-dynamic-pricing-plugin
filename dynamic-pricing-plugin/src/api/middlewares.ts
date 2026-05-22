import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { z } from "zod"

export const CreatePricingRuleSchema = z.object({
  name: z.string().min(1),
  spread_factor: z.number().optional(),
  spread_fixed: z.number().optional(),
  premium_percentage: z.number().optional(),
  premium_fixed: z.number().optional(),
})
export type CreatePricingRuleSchema = z.infer<typeof CreatePricingRuleSchema>

export const AssignVariantPricingRuleSchema = z.object({
  pricing_rule_id: z.string().min(1),
  material: z.string().min(1),
})
export type AssignVariantPricingRuleSchema = z.infer<typeof AssignVariantPricingRuleSchema>

// Bulk product assign uses the same shape
export const BulkAssignProductPricingRuleSchema = AssignVariantPricingRuleSchema
export type BulkAssignProductPricingRuleSchema = AssignVariantPricingRuleSchema

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/dynamic-pricing/pricing-rules",
      method: "POST",
      middlewares: [validateAndTransformBody(CreatePricingRuleSchema)],
    },
    {
      matcher: "/admin/dynamic-pricing/variants/:id/pricing-rule",
      method: "POST",
      middlewares: [validateAndTransformBody(AssignVariantPricingRuleSchema)],
    },
    {
      matcher: "/admin/dynamic-pricing/products/:id/pricing-rule",
      method: "POST",
      middlewares: [validateAndTransformBody(BulkAssignProductPricingRuleSchema)],
    },
  ],
})
