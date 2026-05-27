import { listSpotPrices } from "@lib/data/spot-prices"
import { convertToLocale } from "@lib/util/money"
import { materialName } from "@lib/util/metal"

function inferMaterial(title: string): string | null {
  const lower = title.toLowerCase()
  if (lower.includes("gold") || lower.includes("xau")) return "XAU"
  if (lower.includes("silver") || lower.includes("xag")) return "XAG"
  return null
}

export default async function SpotPriceInfo({
  productTitle,
}: {
  productTitle: string
}) {
  const prices = await listSpotPrices().catch(() => null)

  if (!prices || prices.length === 0) {
    return null
  }

  const highlightMaterial = inferMaterial(productTitle)

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-rounded p-4">
      <h3 className="text-sm font-semibold text-neutral-700 mb-2">
        Current Spot Prices
      </h3>
      <div className="space-y-1.5">
        {prices.map((sp) => {
          const isHighlighted = sp.material === highlightMaterial
          return (
            <div
              key={sp.material}
              className={`flex items-center justify-between text-sm ${
                isHighlighted
                  ? "font-semibold text-neutral-900"
                  : "text-neutral-600"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    sp.material === "XAU" ? "bg-yellow-500" : "bg-gray-400"
                  }`}
                />
                {materialName(sp.material)}
              </span>
              <span>
                {convertToLocale({
                  amount: sp.price,
                  currency_code: "USD",
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-neutral-400">
                B {convertToLocale({
                  amount: sp.bid,
                  currency_code: "USD",
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}{" "}
                / A{" "}
                {convertToLocale({
                  amount: sp.ask,
                  currency_code: "USD",
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
