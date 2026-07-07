"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import type { SpotPricePayload } from "@u11d/medusa-dynamic-pricing/client"
import { sdk } from "@lib/config"

const POLL_FALLBACK_MS = 30_000

type SpotPriceContextValue = {
  prices: SpotPricePayload[]
  isLoading: boolean
  error: boolean
}

const SpotPriceContext = createContext<SpotPriceContextValue | null>(null)

function isSpotPricePayload(value: unknown): value is SpotPricePayload {
  if (!value || typeof value !== "object") {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.material === "string" &&
    typeof record.price === "number" &&
    typeof record.ask === "number" &&
    typeof record.bid === "number" &&
    typeof record.timestamp === "string"
  )
}

function parseSpotPriceArray(value: unknown): SpotPricePayload[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isSpotPricePayload)
}

export function SpotPriceProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<SpotPricePayload[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sortPrices = useCallback((data: SpotPricePayload[]) => {
    return [...data].sort((a, b) =>
      a.material === "XAU" ? -1 : b.material === "XAU" ? 1 : 0
    )
  }, [])

  const onPrices = useCallback((data: SpotPricePayload[]) => {
    setPrices((prev) => {
      if (prev.length === data.length && prev.every((p, i) => p.price === data[i].price && p.material === data[i].material)) {
        return prev
      }
      return sortPrices(data)
    })
    setError(false)
    setIsLoading(false)
  }, [sortPrices])

  // SSE connection
  useEffect(() => {
    let cancelled = false

    function connect() {
      if (cancelled) return

      const es = new EventSource("/api/sse/spot-prices")
      esRef.current = es

      es.addEventListener("spot-prices", (event) => {
        try {
          const data = parseSpotPriceArray(JSON.parse(event.data))
          if (!cancelled) onPrices(data)
        } catch {
          // ignore malformed events
        }
      })

      es.onerror = () => {
        es.close()
        esRef.current = null
        if (!cancelled) {
          setError(true)
          setIsLoading(false)
          startFallback()
        }
      }
    }

    function startFallback() {
      if (cancelled) return

      const fetchPrices = async () => {
        try {
          const data = await sdk.client.fetch<{ spot_prices: SpotPricePayload[] }>(
            "/store/dynamic-pricing/spot-prices",
            {
              method: "GET",
              cache: "no-store",
            }
          )

          if (!cancelled) {
            onPrices(parseSpotPriceArray(data.spot_prices))
          }
        } catch {
          if (!cancelled) {
            setError(true)
          }
        }
      }

      fetchPrices()
      intervalRef.current = setInterval(fetchPrices, POLL_FALLBACK_MS)
    }

    connect()

    return () => {
      cancelled = true
      esRef.current?.close()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [onPrices])

  return (
    <SpotPriceContext.Provider value={{ prices, isLoading, error }}>
      {children}
    </SpotPriceContext.Provider>
  )
}

export function useSpotPrices(): SpotPriceContextValue {
  const ctx = useContext(SpotPriceContext)
  if (!ctx) {
    throw new Error("useSpotPrices must be used within a SpotPriceProvider")
  }
  return ctx
}
