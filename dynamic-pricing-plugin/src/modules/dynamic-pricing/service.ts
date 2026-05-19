import { MedusaService } from "@medusajs/framework/utils"
import SpotPrice from "./models/spot-price.js"

class DynamicPricingModuleService extends MedusaService({
  SpotPrice,
}) {}

export default DynamicPricingModuleService
