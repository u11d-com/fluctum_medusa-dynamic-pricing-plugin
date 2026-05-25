import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "./lib/client"
import type { PricingRulesListResponse, ConfigResponse, VariantAssignment, SpotPricePayload } from "./types"

export function useRules(enabled: boolean) {
  return useQuery<PricingRulesListResponse>({
    queryKey: ["dynamic-pricing-rules-all"],
    queryFn: () =>
      sdk.client.fetch<PricingRulesListResponse>(
        "/admin/dynamic-pricing/pricing-rules?limit=200"
      ),
    enabled,
  })
}

export function useMaterials(enabled: boolean) {
  return useQuery<ConfigResponse>({
    queryKey: ["dynamic-pricing-config"],
    queryFn: () =>
      sdk.client.fetch<ConfigResponse>("/admin/dynamic-pricing/config"),
    enabled,
    staleTime: Infinity,
  })
}

export function useVariantRule(variantId: string) {
  return useQuery<VariantAssignment>({
    queryKey: ["variant-pricing-rule", variantId],
    queryFn: () =>
      sdk.client.fetch<VariantAssignment>(
        `/admin/dynamic-pricing/variants/${variantId}/pricing-rule`
      ),
  })
}

/**
 * Subscribes to the admin SSE stream and returns a live map of
 * material → SpotPricePayload. Updates automatically on every broadcast.
 *
 * Connection is established once and torn down on unmount.
 */
export function useLiveSpotPrices(): SpotPriceMap {
  const [prices, setPrices] = useState<SpotPriceMap>({})

  useEffect(() => {
    let abortFn: (() => void) | null = null
    let cancelled = false

    async function connect() {
      try {
        const { stream, abort } = await sdk.client.fetchStream(
          "/admin/dynamic-pricing/sse"
        )
        if (cancelled) {
          abort()
          return
        }
        abortFn = abort

        for await (const event of stream) {
          if (event.event === "spot-prices" && event.data) {
            try {
              const list = JSON.parse(event.data) as SpotPricePayload[]
              setPrices((prev) => {
                const next = { ...prev }
                for (const sp of list) {
                  next[sp.material] = sp
                }
                return next
              })
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch {
        // connection error — prices stay at last known value
      }
    }

    connect()

    return () => {
      cancelled = true
      abortFn?.()
    }
  }, [])

  return prices
}
