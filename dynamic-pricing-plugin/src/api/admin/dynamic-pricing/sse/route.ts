import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { randomUUID } from "crypto"
import sseManager from "../../../../utils/sse-manager"
import { DYNAMIC_PRICING_MODULE } from "../../../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../../../modules/dynamic-pricing/service"

/**
 * GET /admin/dynamic-pricing/sse
 *
 * Server-Sent Events stream for the admin panel.
 * Medusa's framework automatically applies bearer/session auth to all
 * /admin/* routes, so this endpoint is protected.
 *
 * On connection:
 *   1. Sends the current (latest) spot prices immediately as the first event.
 *   2. Keeps the connection open and forwards every subsequent broadcast from
 *      the SseManager until the client disconnects.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("X-Accel-Buffering", "no") // disable nginx buffering
  res.flushHeaders()

  const id = randomUUID()
  sseManager.add(id, res)

  // Send current prices immediately on connect so the client doesn't have
  // to wait up to fetchIntervalSeconds for the first data
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
        timestamp: sp.created_at,
      }))
      res.write(
        `event: spot-prices\ndata: ${JSON.stringify(payload)}\n\n`
      )
    }
  } catch {
    // non-fatal — client will receive prices on the next broadcast
  }

  // Keep-alive ping every 30 s to prevent proxy timeouts
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
