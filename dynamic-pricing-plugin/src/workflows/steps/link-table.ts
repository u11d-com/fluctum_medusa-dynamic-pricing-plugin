import { MedusaContainer } from "@medusajs/framework/types"
import { DYNAMIC_PRICING_MODULE } from "../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../modules/dynamic-pricing/service"

export const LINK_TABLE = "product_product_variant_dynamicpricing_pricing_rule"

export function getLinkKnex(container: MedusaContainer) {
  const service = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
  return service.getKnex()
}
