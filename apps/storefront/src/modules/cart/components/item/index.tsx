"use client"

import { Table, Text, clx } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState, useEffect } from "react"
import ItemPrice from "./item-price"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  cart?: HttpTypes.StoreCart
  type?: "full" | "preview"
  currencyCode: string
  lockedPrice?: { unit_price: number; total: number } | null
}

const Item = ({ item, cart, type = "full", currencyCode, lockedPrice }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState<string>(String(item.quantity))

  useEffect(() => {
    setInputValue(String(item.quantity))
  }, [item.quantity])

  const changeQuantity = async (quantity: number) => {
    const clamped = Math.max(1, quantity)
    setInputValue(String(clamped))
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity: clamped,
    })
      .catch((err) => {
        setError(err.message)
        setInputValue(String(item.quantity))
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const commitQuantity = () => {
    const parsed = parseInt(inputValue, 10)
    if (isNaN(parsed) || parsed < 1) {
      setInputValue(String(item.quantity))
      return
    }
    if (parsed !== item.quantity) {
      changeQuantity(parsed)
    } else {
      setInputValue(String(item.quantity))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur()
    }
  }

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex gap-2 items-center w-28">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <div className="flex items-center border border-gray-200 rounded">
              <button
                className="w-8 h-8 flex items-center justify-center text-ui-fg-base hover:bg-gray-100 disabled:opacity-30"
                disabled={updating || item.quantity <= 1}
                onClick={() => changeQuantity(item.quantity - 1)}
                data-testid="product-decrement-button"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={commitQuantity}
                onKeyDown={handleKeyDown}
                disabled={updating}
                className="w-10 h-8 flex items-center justify-center text-small-regular border-x border-gray-200 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                data-testid="product-quantity"
              />
              <button
                className="w-8 h-8 flex items-center justify-center text-ui-fg-base hover:bg-gray-100"
                disabled={updating}
                onClick={() => changeQuantity(item.quantity + 1)}
                data-testid="product-increment-button"
              >
                +
              </button>
            </div>
            {updating && (
              <span className="text-ui-fg-muted text-small-regular">...</span>
            )}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      <ItemPrice
        item={item}
        type={type}
        currencyCode={currencyCode}
        lockedPrice={lockedPrice}
        cart={cart}
      />
    </Table.Row>
  )
}

export default Item
