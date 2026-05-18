import { Module } from "@medusajs/framework/utils"
import DynamicPricingModuleService from "./service.js"
import dynamicPricingLoader from "./loaders/config-loader.js"

export const DYNAMIC_PRICING_MODULE = "dynamicPricing"

export default Module(DYNAMIC_PRICING_MODULE, {
  service: DynamicPricingModuleService,
  loaders: [dynamicPricingLoader],
})
