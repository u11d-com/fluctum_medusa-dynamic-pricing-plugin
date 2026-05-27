import { listSpotPrices } from "@lib/data/spot-prices"
import { convertToLocale } from "@lib/util/money"

export default async function SpotPriceBar() {
  let prices = await listSpotPrices().catch(() => null)

  if (!prices || prices.length === 0) {
    return null
  }

  return (
    <div className="bg-neutral-900 text-neutral-100 text-xs py-1.5">
      <div className="content-container flex items-center justify-center gap-6">
        {prices.map((sp) => (
          <div key={sp.material} className="flex items-center gap-1.5">
            <span className="font-semibold">{sp.material}</span>
            <span>
              {convertToLocale({
                amount: sp.price,
                currency_code: "USD",
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-neutral-400">
              B {convertToLocale({
                amount: sp.bid,
                currency_code: "USD",
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-neutral-400">
              A {convertToLocale({
                amount: sp.ask,
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
