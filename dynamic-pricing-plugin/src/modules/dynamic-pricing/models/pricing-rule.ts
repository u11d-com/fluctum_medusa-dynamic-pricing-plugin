import { model } from "@medusajs/framework/utils"

const PricingRule = model.define("pricing_rule", {
  id: model.id().primaryKey(),
  name: model.text(),
  spread_factor: model.bigNumber().default(1),
  spread_fixed: model.bigNumber().default(0),
  premium_percentage: model.bigNumber().default(0),
  premium_fixed: model.bigNumber().default(0),
})

export default PricingRule
