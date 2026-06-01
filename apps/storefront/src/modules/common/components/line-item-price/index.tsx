import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
  price?: number
}

const LineItemPrice = ({
  item,
  style = "default",
  currencyCode,
  price,
}: LineItemPriceProps) => {
  const currentPrice = price ?? item.total ?? 0

  return (
    <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
      <div className="text-left">
        <span data-testid="product-price">
          {convertToLocale({
            amount: currentPrice,
            currency_code: currencyCode,
          })}
        </span>
      </div>
    </div>
  )
}

export default LineItemPrice
