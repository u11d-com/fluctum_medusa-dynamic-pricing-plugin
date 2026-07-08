"use client"

import { getCountryCodeFromParams } from "@lib/util/route"
import { useCart } from "@modules/cart/context/cart-context"
import { useParams } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@modules/common/components/ui"
import { useTranslations } from "next-intl"

type AddToCartButtonProps = {
  variantId: string
}

function Spinner() {
  return (
    <svg
      className="w-3.5 h-3.5 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export default function AddToCartButton({ variantId }: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const [isPending, startTransition] = useTransition()
  const countryCode = getCountryCodeFromParams(useParams())
  const t = useTranslations('product')

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isPending) return

    startTransition(async () => {
      try {
        if (!countryCode) {
          throw new Error("Missing country code")
        }
        await addToCart({ variantId, quantity: 1, countryCode })
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : t('addToCartError')
        )
      }
    })
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant="primary"
      size="xs"
      className="shrink-0 rounded-lg"
      data-testid="add-to-cart-button"
    >
      {isPending ? <Spinner /> : t('addToCart')}
    </Button>
  )
}
