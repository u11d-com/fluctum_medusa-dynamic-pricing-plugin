/**
 * SSE connection manager — module-scoped singleton.
 *
 * Tracks the SSE clients connected to *this* process and fans spot-price
 * updates out to them.
 *
 * Cross-process delivery: in production Medusa runs the HTTP server and the
 * worker (which runs the fetch job) as separate processes, possibly with
 * several server replicas. When the project has a `redisUrl`, `publish()`
 * goes through Redis pub/sub and every process that holds SSE clients
 * subscribes to the channel and writes to its own clients. Without Redis
 * (tests, single-process dev) `publish()` broadcasts in-process.
 *
 * Delivery is best-effort by design: prices are re-published every fetch
 * interval and new SSE connections get a DB snapshot, so a dropped message
 * self-heals on the next tick. That's why nothing is queued while Redis is
 * unavailable — stale prices must never be replayed.
 */

import { Response } from "express"
import Redis from "ioredis"
import type { Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type SpotPricePayload = {
  material: string
  price: number
  ask: number
  bid: number
  timestamp: string
}

export const SPOT_PRICES_CHANNEL = "dynamic-pricing:spot-prices"

type ScopeLike = Pick<MedusaContainer, "resolve">

// Connection errors (e.g. ECONNREFUSED) arrive with an empty message.
function describeError(err: Error): string {
  return err.message || ("code" in err ? String(err.code) : err.name)
}

function getRedisUrl(scope: ScopeLike): string | undefined {
  const config = scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  return config.projectConfig.redisUrl || undefined
}

class SseManager {
  private clients: Map<string, Response> = new Map()
  private publisher: Redis | null = null
  private subscriber: Redis | null = null

  /** Registers a client and makes sure this process receives Redis broadcasts. */
  add(id: string, res: Response, scope: ScopeLike) {
    this.ensureSubscriber(scope)
    this.clients.set(id, res)
  }

  remove(id: string) {
    this.clients.delete(id)
  }

  /** Delivers prices to SSE clients on every process (via Redis when configured). */
  async publish(prices: SpotPricePayload[], scope: ScopeLike) {
    const publisher = this.ensurePublisher(scope)
    if (!publisher) {
      this.broadcast(prices)
      return
    }

    try {
      await publisher.publish(SPOT_PRICES_CHANNEL, JSON.stringify(prices))
    } catch (err) {
      // Redis unavailable: still serve clients of this process (covers
      // single-process deployments); other processes catch up next tick.
      this.logger(scope).warn(`[dynamic-pricing-plugin] SSE publish to Redis failed: ${String(err)}`)
      this.broadcast(prices)
    }
  }

  /** Writes to the SSE clients connected to this process only. */
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

  private ensurePublisher(scope: ScopeLike): Redis | null {
    if (this.publisher) return this.publisher
    const url = getRedisUrl(scope)
    if (!url) return null

    const logger = this.logger(scope)
    // maxRetriesPerRequest: 0 — commands may wait for the initial connection,
    // but are rejected as soon as a connection attempt fails, so publish()
    // never buffers prices that would be stale once delivered.
    this.publisher = new Redis(url, { maxRetriesPerRequest: 0 })
    this.publisher.on("error", (err) =>
      logger.warn(`[dynamic-pricing-plugin] SSE Redis publisher error: ${describeError(err)}`)
    )
    return this.publisher
  }

  private ensureSubscriber(scope: ScopeLike) {
    if (this.subscriber) return
    const url = getRedisUrl(scope)
    if (!url) return

    const logger = this.logger(scope)
    // ioredis reconnects forever. SUBSCRIBE is idempotent, so (re)subscribing
    // on every "ready" guarantees the subscription after any reconnect, even
    // if an earlier attempt failed.
    const subscriber = new Redis(url, { autoResubscribe: false })
    this.subscriber = subscriber
    subscriber.on("error", (err) =>
      logger.warn(`[dynamic-pricing-plugin] SSE Redis subscriber error: ${describeError(err)}`)
    )
    subscriber.on("ready", () => {
      subscriber.subscribe(SPOT_PRICES_CHANNEL).catch((err) =>
        logger.warn(`[dynamic-pricing-plugin] SSE Redis subscribe failed: ${String(err)}`)
      )
    })
    subscriber.on("message", (channel, message) => {
      if (channel !== SPOT_PRICES_CHANNEL) return
      try {
        const prices: unknown = JSON.parse(message)
        if (Array.isArray(prices)) this.broadcast(prices)
      } catch (err) {
        logger.warn(`[dynamic-pricing-plugin] Ignoring malformed SSE message: ${String(err)}`)
      }
    })
  }

  private logger(scope: ScopeLike): Logger {
    return scope.resolve(ContainerRegistrationKeys.LOGGER)
  }
}

// Module-scoped singleton — survives across request handlers
const sseManager = new SseManager()

export default sseManager
