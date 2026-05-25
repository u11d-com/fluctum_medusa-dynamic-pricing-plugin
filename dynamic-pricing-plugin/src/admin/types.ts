export type PricingRule = {
  id: string
  name: string
  spread_factor: number
  spread_fixed: number
  premium_percentage: number
  premium_fixed: number
}

export type PricingRuleWithMaterial = PricingRule & {
  material: string
  weight_oz: number | null
}

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

export type SpotPricePayload = {
  material: string
  price: number
  ask: number
  bid: number
  timestamp: string
}

/** Map of material symbol → latest live spot price */
export type SpotPriceMap = Record<string, SpotPricePayload>
