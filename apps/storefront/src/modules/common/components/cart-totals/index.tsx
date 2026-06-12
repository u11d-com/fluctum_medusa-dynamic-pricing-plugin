"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
  }
  subtotalOverride?: number
  totalOverride?: number
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals, subtotalOverride, totalOverride }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
  } = totals

  const displaySubtotal = subtotalOverride ?? item_subtotal ?? 0

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span data-testid="cart-subtotal" data-value={displaySubtotal}>
            {convertToLocale({ amount: displaySubtotal, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">Taxes</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-ui-border-base my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={(totalOverride ?? total) || 0}
        >
          {convertToLocale({ amount: totalOverride ?? total ?? 0, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-ui-border-base mt-4" />
    </div>
  )
}

export default CartTotals
