"use client"

import { useRef } from "react"
import type { SpotPricePayload } from "@u11d/medusa-dynamic-pricing/client"
import { convertToLocale } from "@lib/util/money"
import { materialName, materialDotClass } from "@lib/util/metal"
import { useSpotPrices } from "@lib/context/spot-price-context"
import { useCart } from "@modules/cart/context/cart-context"

export default function SpotPriceBarClient({ regionCurrencyCode = "USD" }: { regionCurrencyCode?: string }) {
  const { prices, rates } = useSpotPrices()
  const { cart } = useCart()
  const cachedRef = useRef<SpotPricePayload[]>([])

  // Use cart currency if available, fall back to region currency (when cart dropped on region switch)
  const currencyCode = (cart?.currency_code?.toUpperCase() ?? regionCurrencyCode).toUpperCase()
  const isUsd = currencyCode === "USD"
  const conversionRate = isUsd ? 1 : (rates[currencyCode] ?? null)

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
                {isStale || conversionRate === null
                  ? "—"
                  : convertToLocale({
                      amount: sp.price * conversionRate,
                      currency_code: currencyCode.toLowerCase(),
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
