import { MedusaContainer } from "@medusajs/framework/types"
import { DYNAMIC_PRICING_MODULE } from "../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../modules/dynamic-pricing/service"

export const LINK_TABLE = "product_product_variant_dynamicpricing_pricing_rule"

export type CartPriceLockRow = {
  id: string
  cart_id: string
  variant_id: string
  material: string
  unit_price: number
  quantity: number
  expires_at: Date
  locked_at: Date
  weight_oz: number | null
  currency_code: string
  conversion_rate: number
  spot_price: number
  spread_factor: number
  spread_fixed: number
  premium_percentage: number
  premium_fixed: number
  deleted_at: Date | null
}

export function getLinkKnex(container: MedusaContainer) {
  const service = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
  return service.getKnex()
}
