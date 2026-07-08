"use client"

import { Text, clx } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import { useCartPricing } from "@lib/hooks/use-cart-pricing"
import { useCart } from "@modules/cart/context/cart-context"
import { Table } from "@modules/common/components/ui"

type Props = {
  item: HttpTypes.StoreCartLineItem
  type: "full" | "preview"
  currencyCode: string
  lockedPrice?: { unit_price: number; total: number } | null
  cart?: HttpTypes.StoreCart | null
}

const ItemPrice = ({ item, type, currencyCode, lockedPrice, cart }: Props) => {
  const { regionCurrencyCode } = useCart()
  const { itemPrices } = useCartPricing(cart ?? null, regionCurrencyCode)
  const computedPrice = lockedPrice ?? itemPrices[item.id]

  if (!computedPrice) {
    return (
      <>
        {type === "full" && (
          <Table.Cell className="hidden small:table-cell">
            <span className="text-gray-400 text-sm">—</span>
          </Table.Cell>
        )}
        <Table.Cell className="!pr-0">
          <span className="flex flex-col items-end h-full justify-center text-gray-400 text-sm">—</span>
        </Table.Cell>
      </>
    )
  }

  return (
    <>
      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
            price={computedPrice.unit_price}
          />
        </Table.Cell>
      )}
      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
                price={computedPrice.unit_price}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
            price={computedPrice.total}
          />
        </span>
      </Table.Cell>
    </>
  )
}

export default ItemPrice
