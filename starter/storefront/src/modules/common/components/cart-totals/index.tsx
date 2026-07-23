"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"
import { useTranslations } from "next-intl"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
  }
  // null = show "—" (suppress Medusa fallback); undefined = use Medusa fallback; number = show that value
  subtotalOverride?: number | null
  totalOverride?: number | null
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals, subtotalOverride, totalOverride }) => {
  const t = useTranslations('common')
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
  } = totals

  const displaySubtotal = subtotalOverride !== undefined ? subtotalOverride : (item_subtotal ?? 0)
  const displayTotal = totalOverride !== undefined ? totalOverride : (total ?? 0)

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>{t('subtotal')} (excl. shipping and taxes)</span>
          <span
            data-testid="cart-subtotal"
            key={displaySubtotal ?? "stale"}
            className="inline-block animate-price-pulse"
            data-value={displaySubtotal ?? undefined}
          >
            {displaySubtotal === null
              ? "—"
              : convertToLocale({ amount: displaySubtotal, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t('shipping')}</span>
          <span data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">{t('tax')}</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-ui-border-base my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>{t('total')}</span>
        <span
          key={displayTotal ?? "stale"}
          className="txt-xlarge-plus inline-block animate-price-pulse"
          data-testid="cart-total"
          data-value={displayTotal ?? undefined}
        >
          {displayTotal === null
            ? "—"
            : convertToLocale({ amount: displayTotal, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-ui-border-base mt-4" />
    </div>
  )
}

export default CartTotals
