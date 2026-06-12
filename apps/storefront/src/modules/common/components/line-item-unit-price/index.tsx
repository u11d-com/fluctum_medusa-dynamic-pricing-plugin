import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

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
    <div className="flex flex-col justify-center h-full">
      <Text
        as="span"
        className="text-base-regular text-ui-fg-muted"
        data-testid="product-unit-price"
      >
        {convertToLocale({
          amount: unitAmount,
          currency_code: currencyCode,
        })}
      </Text>
    </div>
  )
}

export default LineItemUnitPrice
