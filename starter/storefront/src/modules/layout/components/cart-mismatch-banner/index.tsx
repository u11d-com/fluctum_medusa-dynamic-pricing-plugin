"use client"

import { transferCart } from "@lib/data/customer"
import { ExclamationCircleSolid } from "@medusajs/icons"
import { StoreCart, StoreCustomer } from "@medusajs/types"
import { Button, StatusNotice } from "@modules/common/components/ui"
import { useTranslations } from "next-intl"
import { useState } from "react"
function CartMismatchBanner(props: {
  customer: StoreCustomer
  cart: StoreCart
}) {
  const { customer, cart } = props
  const t = useTranslations('cart')
  const [isPending, setIsPending] = useState(false)

  if (!customer || !!cart.customer_id) {
    return
  }

  const handleSubmit = async () => {
    try {
      setIsPending(true)
      await transferCart()
    } catch {
      setIsPending(false)
    }
  }

  return (
    <StatusNotice tone="warning" className="mt-2 rounded-none border-x-0">
      <div className="flex items-center justify-center small:p-4 p-2 text-center small:gap-2 gap-1 text-sm">
        <div className="flex flex-col small:flex-row small:gap-2 gap-1 items-center">
        <span className="flex items-center gap-1">
          <ExclamationCircleSolid className="inline" />
          {t('transferError')}
        </span>

        <span>·</span>

        <Button
          variant="transparent"
          className="hover:bg-transparent active:bg-transparent focus:bg-transparent disabled:text-tag-orange-text text-tag-orange-text p-0 bg-transparent"
          size="medium"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending ? t('transferring') : t('runTransferAgain')}
        </Button>
        </div>
      </div>
    </StatusNotice>
  )
}

export default CartMismatchBanner
