import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { randomUUID } from "crypto"
import sseManager from "../../../../utils/sse-manager"
import { DYNAMIC_PRICING_MODULE } from "../../../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../../../modules/dynamic-pricing/service"

/**
 * GET /store/dynamic-pricing/sse
 *
 * Server-Sent Events stream for storefronts.
 * Requires a publishable API key (standard for all /store/* routes).
 *
 * On connection:
 *   1. Sends the current (latest) spot prices immediately.
 *   2. Forwards every subsequent broadcast until the client disconnects.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("X-Accel-Buffering", "no")
  res.flushHeaders()

  const id = randomUUID()
  sseManager.add(id, res)

  // Send current prices immediately so the client doesn't wait for next tick
  try {
    const service = req.scope.resolve<DynamicPricingModuleService>(
      DYNAMIC_PRICING_MODULE
    )
    const current = await service.getLatestSpotPrices()
    if (current.length > 0) {
      const payload = current.map((sp) => ({
        material: sp.material,
        price: Number(sp.price),
        ask: Number(sp.ask),
        bid: Number(sp.bid),
        timestamp: sp.created_at.toISOString(),
      }))
      res.write(`event: spot-prices\ndata: ${JSON.stringify(payload)}\n\n`)
    }
  } catch {
    // non-fatal — client will receive prices on the next broadcast
  }

  // Keep-alive ping every 30 s
  const keepAlive = setInterval(() => {
    try {
      res.write(": keep-alive\n\n")
    } catch {
      clearInterval(keepAlive)
    }
  }, 30_000)

  req.on("close", () => {
    clearInterval(keepAlive)
    sseManager.remove(id)
  })
}
