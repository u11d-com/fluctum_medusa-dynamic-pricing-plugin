import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DYNAMIC_PRICING_MODULE } from "../../../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../../../modules/dynamic-pricing/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<DynamicPricingModuleService>(
    DYNAMIC_PRICING_MODULE
  )

  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const offset = Number(req.query.offset) || 0
  const material = req.query.material as string | undefined

  const filters = material ? { material: material.toUpperCase() } : {}

  const [spotPrices, count] = await service.listAndCountSpotPrices(filters, {
    take: limit,
    skip: offset,
    order: { created_at: "DESC" },
  })

  res.json({
    spot_prices: spotPrices,
    count,
    limit,
    offset,
  })
}
