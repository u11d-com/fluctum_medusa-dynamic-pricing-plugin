import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
  price?: number
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode,
  price,
}: LineItemUnitPriceProps) => {
  const unitAmount = price ?? (item.total ?? 0) / item.quantity

  return (
    <div className="flex flex-col text-ui-fg-muted justify-center h-full">
      <span
        className="text-base-regular"
        data-testid="product-unit-price"
      >
        {convertToLocale({
          amount: unitAmount,
          currency_code: currencyCode,
        })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice
