"use client"

import { addToCart } from "@lib/data/cart"
import { getCountryCodeFromParams } from "@lib/util/route"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@modules/common/components/ui"

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
  const [isLoading, setIsLoading] = useState(false)
  const countryCode = getCountryCodeFromParams(useParams())

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isLoading) return

    setIsLoading(true)
    try {
      if (!countryCode) {
        throw new Error("Missing country code")
      }

      await addToCart({ variantId, quantity: 1, countryCode })
      toast.success("Added to cart")
    } catch {
      toast.error("Could not add to cart. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant="primary"
      size="xs"
      className="shrink-0 rounded-lg"
      data-testid="add-to-cart-button"
    >
      {isLoading ? <Spinner /> : null}
      {isLoading ? "Adding" : "Add"}
    </Button>
  )
}
