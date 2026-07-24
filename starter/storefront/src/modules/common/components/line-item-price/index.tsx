import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
  price?: number
}

const LineItemPrice = ({
  item: _item,
  style = "default",
  currencyCode,
  price,
}: LineItemPriceProps) => {
  return (
    <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
      <div className="text-left">
        {price !== undefined ? (
          <span
            key={price}
            className="inline-block animate-price-pulse"
            data-testid="product-price"
            data-value={price}
          >
            {convertToLocale({
              amount: price,
              currency_code: currencyCode,
            })}
          </span>
        ) : (
          <span data-testid="product-price">—</span>
        )}
      </div>
    </div>
  )
}

export default LineItemPrice
