import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import DynamicPricingModule from "../modules/dynamic-pricing"

/**
 * Links a Medusa ProductVariant to a PricingRule (one-to-one).
 *
 * Extra column on the link table:
 *   - material: spot price symbol (e.g. "XAU", "XAG"), validated against
 *               plugin config at assignment time
 *
 * Weight is intentionally NOT stored here — it lives on the native
 * ProductVariant.weight field (troy oz), editable from the standard
 * Medusa admin variant form.
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
      },
    },
  }
)
