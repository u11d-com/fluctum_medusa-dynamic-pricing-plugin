import { MedusaService } from "@medusajs/framework/utils"
import SpotPrice from "./models/spot-price"

class DynamicPricingModuleService extends MedusaService({
  SpotPrice,
}) {}

export default DynamicPricingModuleService
