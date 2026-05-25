import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DYNAMIC_PRICING_MODULE } from "../../../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../../../modules/dynamic-pricing/service"

/**
 * GET /store/dynamic-pricing/spot-prices
 *
 * Returns the latest spot price for each configured material.
 * Requires a publishable API key (standard for all /store/* routes).
 *
 * Query params:
 *   material (optional) — filter to a single material symbol (case-insensitive)
 *
 * Response:
 *   { spot_prices: SpotPricePayload[] }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<DynamicPricingModuleService>(
    DYNAMIC_PRICING_MODULE
  )

  const rawMaterial = req.query.material
  const material = typeof rawMaterial === "string" ? rawMaterial.toUpperCase() : undefined
  const materials = material ? [material] : undefined

  const rows = await service.getLatestSpotPrices(materials)

  res.json({
    spot_prices: rows.map((sp) => ({
      material: sp.material,
      price: sp.price,
      ask: sp.ask,
      bid: sp.bid,
      timestamp: sp.created_at.toISOString(),
    })),
  })
}
