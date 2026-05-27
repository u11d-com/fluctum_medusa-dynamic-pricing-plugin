"use client"

import { convertToLocale } from "@lib/util/money"
import { materialName } from "@lib/util/metal"
import { useSpotPrices } from "@lib/context/spot-price-context"

export default function SpotPriceBarClient() {
  const { prices, error } = useSpotPrices()

  if (error || prices.length === 0) {
    return null
  }

  return (
    <div className="bg-neutral-900 text-neutral-100 text-xs py-1.5">
      <div className="content-container flex items-center justify-center gap-6">
        {prices.map((sp) => (
          <div key={sp.material} className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sp.material === "XAU" ? "bg-yellow-400" : "bg-gray-400"
              }`}
            />
            <span className="font-semibold">{materialName(sp.material)}</span>
            <span>
              {convertToLocale({
                amount: sp.price,
                currency_code: "USD",
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
