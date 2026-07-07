"use client"

import { useRef } from "react"
import type { SpotPricePayload } from "@u11d/medusa-dynamic-pricing/client"
import { convertToLocale } from "@lib/util/money"
import { materialName, materialDotClass } from "@lib/util/metal"
import { useSpotPrices } from "@lib/context/spot-price-context"

export default function SpotPriceBarClient() {
  const { prices } = useSpotPrices()
  const cachedRef = useRef<SpotPricePayload[]>([])

  if (prices.length > 0) {
    cachedRef.current = prices
  }

  const display = prices.length > 0 ? prices : cachedRef.current
  const isStale = prices.length === 0

  return (
    <div className="bg-neutral-900 text-neutral-100 text-xs py-1.5">
      <div className="content-container flex items-center justify-center gap-12">
        {display.length > 0 ? (
          display.map((sp) => (
            <div key={sp.material} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${materialDotClass(sp.material)}`} />
              <span className="font-semibold">{materialName(sp.material)}</span>
              <span>
                {isStale
                  ? "—"
                  : convertToLocale({
                      amount: sp.price,
                      currency_code: "USD",
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
              </span>
            </div>
          ))
        ) : (
          <span className="text-neutral-500">—</span>
        )}
      </div>
    </div>
  )
}
