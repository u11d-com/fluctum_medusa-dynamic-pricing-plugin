import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPluginOptions } from "../../../../modules/dynamic-pricing/options-store"

export async function GET(
  _req: MedusaRequest,
  res: MedusaResponse
) {
  const { materials, fetchIntervalSeconds, priceLockDurationSeconds, provider } =
    getPluginOptions()

  res.json({
    config: {
      materials,
      fetchIntervalSeconds,
      priceLockDurationSeconds,
      providerName: (provider as Function).name || "unknown",
    },
  })
}
