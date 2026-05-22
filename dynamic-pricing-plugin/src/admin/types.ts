export type PricingRule = {
  id: string
  name: string
  spread_factor: number
  spread_fixed: number
  premium_percentage: number
  premium_fixed: number
}

export type PricingRuleWithMaterial = PricingRule & { material: string }

export type VariantAssignment = {
  pricing_rule: PricingRuleWithMaterial | null
}

export type PricingRulesListResponse = {
  pricing_rules: PricingRule[]
  count?: number
}

export type ConfigResponse = {
  config: { materials: string[] }
}
