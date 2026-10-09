import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DYNAMIC_PRICING_MODULE } from "../../../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../../../modules/dynamic-pricing/service"
import { getPluginOptions } from "../../../../modules/dynamic-pricing/options-store"
import { getCachedLatestRates } from "../../../../utils/latest-prices-cache"

/**
 * GET /store/dynamic-pricing/currency-rates
 *
 * Returns the latest FX conversion rates relative to the plugin's pricingCurrency.
 * Response shape matches the `currency-rates` SSE event: { rates: Record<string, number> }
 * where keys are UPPERCASE ISO-3 currency codes.
 *
 * Used by the storefront SSE fallback (polling) path when the SSE connection fails.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
  const options = getPluginOptions()

  const rows = await getCachedLatestRates(service, options.pricingCurrency)
  const rates: Record<string, number> = {}
  for (const row of rows) {
    rates[row.to_currency.toUpperCase()] = row.rate
  }

  res.json({ rates })
}
