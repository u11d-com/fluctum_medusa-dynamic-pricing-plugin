"use client"

import { useEffect, useRef, useState } from "react"
import type { SpotPricePayload } from "@u11d/medusa-dynamic-pricing/client"
import { convertToLocale } from "@lib/util/money"
import { materialName, materialDotClass } from "@lib/util/metal"
import { useSpotPrices } from "@lib/context/spot-price-context"
import { useCart } from "@modules/cart/context/cart-context"

const CAROUSEL_INTERVAL_MS = 4000

type DisplayItem = {
  material: string
  amount: number | null
}

function SpotPriceValue({
  item,
  currencyCode,
  className = "",
}: {
  item: DisplayItem
  currencyCode: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`w-2.5 h-2.5 rounded-full animate-dot-pulse ${materialDotClass(item.material)}`}
      />
      <span className="font-semibold">{materialName(item.material)}</span>
      <span
        key={item.amount ?? "stale"}
        className="inline-block animate-price-pulse"
      >
        {item.amount === null
          ? "—"
          : convertToLocale({
              amount: item.amount,
              currency_code: currencyCode.toLowerCase(),
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            })}
      </span>
    </div>
  )
}

export default function SpotPriceBarClient({
  regionCurrencyCode = "USD",
}: {
  regionCurrencyCode?: string
}) {
  const { prices, rates } = useSpotPrices()
  const { cart } = useCart()
  const cachedRef = useRef<SpotPricePayload[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  // Use cart currency if available, fall back to region currency (when cart dropped on region switch)
  const currencyCode = (
    cart?.currency_code?.toUpperCase() ?? regionCurrencyCode
  ).toUpperCase()
  const isUsd = currencyCode === "USD"
  const conversionRate = isUsd ? 1 : (rates[currencyCode] ?? null)

  if (prices.length > 0) {
    cachedRef.current = prices
  }

  const display = prices.length > 0 ? prices : cachedRef.current
  const isStale = prices.length === 0

  const items: DisplayItem[] = display.map((sp) => ({
    material: sp.material,
    amount:
      isStale || conversionRate === null ? null : sp.price * conversionRate,
  }))

  useEffect(() => {
    if (items.length <= 1) {
      setActiveIndex(0)
      return
    }

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length)
    }, CAROUSEL_INTERVAL_MS)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  const activeItem = items[activeIndex % items.length] ?? null

  return (
    <div className="bg-neutral-900 text-neutral-100 text-sm py-2.5">
      <div className="content-container">
        {/* Tablet+ : all materials in a row */}
        <div className="hidden xsmall:flex items-center justify-center gap-14">
          {items.length > 0 ? (
            items.map((item) => (
              <SpotPriceValue
                key={item.material}
                item={item}
                currencyCode={currencyCode}
              />
            ))
          ) : (
            <span className="text-neutral-500">—</span>
          )}
        </div>

        {/* Phone : auto-rotating single-item carousel */}
        <div className="flex xsmall:hidden flex-col items-center gap-1.5">
          {activeItem ? (
            <SpotPriceValue
              key={activeItem.material}
              item={activeItem}
              currencyCode={currencyCode}
              className="animate-carousel-fade"
            />
          ) : (
            <span className="text-neutral-500">—</span>
          )}
          {items.length > 1 && (
            <div className="flex items-center gap-1.5">
              {items.map((item, index) => (
                <span
                  key={item.material}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === activeIndex % items.length
                      ? "bg-neutral-100"
                      : "bg-neutral-700"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
