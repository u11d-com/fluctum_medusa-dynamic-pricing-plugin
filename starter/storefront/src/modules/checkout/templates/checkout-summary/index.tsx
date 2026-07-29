"use client"

import { useTranslations } from "next-intl"
import { Heading, Surface } from "@modules/common/components/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import PriceLockCountdown from "@modules/checkout/components/price-lock-countdown"
import CartTotals from "@modules/common/components/cart-totals"
import { Divider } from "@modules/common/components/ui"
import { lockCartPrices } from "@lib/data/cart"
import { buildLockedPriceMap } from "@lib/util/dynamic-pricing"
import { useState, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import type { LockedPriceMap } from "@u11d/medusa-dynamic-pricing/client"

type Props = {
  cart: HttpTypes.StoreCart
  initialLockedPrices: LockedPriceMap | null
  initialExpiresAt: string | null
  initialError: string | null
}

const CheckoutSummary = ({
  cart,
  initialLockedPrices,
  initialExpiresAt,
  initialError,
}: Props) => {
  const t = useTranslations("checkout")
  // Seeded from the checkout page's server-side lock (force=false, idempotent
  // reuse) — no client-side fetch-on-mount is needed. This state only changes
  // when the user explicitly clicks "Refresh prices" (force=true) below.
  const [refreshResult, setRefreshResult] = useState<
    { lockedPrices: LockedPriceMap; expiresAt: string } | undefined
  >(
    initialLockedPrices && initialExpiresAt
      ? { lockedPrices: initialLockedPrices, expiresAt: initialExpiresAt }
      : undefined,
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(initialError)

  const lockedPrices = refreshResult?.lockedPrices ?? null
  const expiresAt = refreshResult?.expiresAt ?? null

  const doLock = async () => {
    if (!cart.id) return
    setIsRefreshing(true)
    setRefreshError(null)

    try {
      const result = await lockCartPrices(cart.id, true)
      const prices = buildLockedPriceMap(result.locks, cart.items ?? [])
      setRefreshResult({ lockedPrices: prices, expiresAt: result.expires_at })
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : t("failedToLockPrices"))
    } finally {
      setIsRefreshing(false)
    }
  }

  const lockedSubtotal = useMemo(() => {
    if (!lockedPrices) return 0
    let total = 0
    for (const price of Object.values(lockedPrices)) {
      total += price.total
    }
    return Math.round(total * 100) / 100
  }, [lockedPrices])

  const lockedTotal =
    lockedSubtotal > 0
      ? lockedSubtotal + (cart.shipping_subtotal ?? 0) + (cart.tax_total ?? 0)
      : null

  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0 ">
      <Surface className="w-full p-6 flex flex-col">
        <PriceLockCountdown
          expiresAt={expiresAt}
          isRefreshing={isRefreshing}
          onRefresh={doLock}
          error={refreshError}
        />
        <CartTotals
          totals={cart}
          subtotalOverride={lockedSubtotal > 0 ? lockedSubtotal : null}
          totalOverride={lockedTotal}
        />
        <ItemsPreviewTemplate cart={cart} lockedPrices={lockedPrices} />
      </Surface>
    </div>
  )
}

export default CheckoutSummary
