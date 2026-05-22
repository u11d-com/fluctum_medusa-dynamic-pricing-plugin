/**
 * SSE connection manager — module-scoped singleton.
 *
 * Keeps track of all active Server-Sent Events clients (admin panel)
 * and broadcasts spot-price updates to them.
 *
 * Store/storefront SSE will be added in Step 7.
 */

import { Response } from "express"

export type SpotPricePayload = {
  material: string
  price: number
  ask: number
  bid: number
  timestamp: string
}

class SseManager {
  private clients: Map<string, Response> = new Map()

  add(id: string, res: Response) {
    this.clients.set(id, res)
  }

  remove(id: string) {
    this.clients.delete(id)
  }

  broadcast(prices: SpotPricePayload[]) {
    const message = `event: spot-prices\ndata: ${JSON.stringify(prices)}\n\n`
    const dead: string[] = []
    for (const [id, res] of this.clients.entries()) {
      try {
        res.write(message)
      } catch {
        // client disconnected before the "close" event fired
        dead.push(id)
      }
    }
    for (const id of dead) {
      this.clients.delete(id)
    }
  }

  get clientCount() {
    return this.clients.size
  }
}

// Module-scoped singleton — survives across request handlers
const sseManager = new SseManager()

export default sseManager
