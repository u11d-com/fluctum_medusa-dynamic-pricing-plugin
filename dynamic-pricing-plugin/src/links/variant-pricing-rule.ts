import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import DynamicPricingModule from "../modules/dynamic-pricing"

/**
 * Links a Medusa ProductVariant to a PricingRule (one-to-one).
 *
 * Extra columns on the link table:
 *   - material:   spot price symbol (e.g. "XAU", "XAG"), validated against
 *                 plugin config at assignment time
 *   - weight_oz:  pricing weight in troy ounces (31.103 g), set explicitly
 *                 at assignment time. Intentionally separate from
 *                 ProductVariant.weight which is the shipping weight in grams.
 */
export default defineLink(
  ProductModule.linkable.productVariant,
  DynamicPricingModule.linkable.pricingRule,
  {
    database: {
      extraColumns: {
        material: {
          type: "text",
          nullable: false,
        },
        weight_oz: {
          type: "float",
          nullable: true,
        },

      },
    },
  }
)
