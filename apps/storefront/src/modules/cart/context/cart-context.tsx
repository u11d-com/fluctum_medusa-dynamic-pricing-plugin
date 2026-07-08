"use client"

import {
  addToCart as addToCartAction,
  deleteLineItem as deleteLineItemAction,
  updateLineItem as updateLineItemAction,
} from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import { createContext, ReactNode, useContext, useState } from "react"
import { toast } from "sonner"

type StoreCart = HttpTypes.StoreCart

type CartContextValue = {
  cart: StoreCart | null
  regionCurrencyCode: string
  addToCart: (input: {
    variantId: string
    quantity: number
    countryCode: string
  }) => Promise<void>
  updateLineItem: (input: {
    lineId: string
    quantity: number
  }) => Promise<void>
  deleteLineItem: (lineId: string) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({
  initialCart,
  regionCurrencyCode,
  children,
}: {
  initialCart: StoreCart | null
  regionCurrencyCode: string
  children: ReactNode
}) {
  const [cart, setCart] = useState<StoreCart | null>(initialCart)
  const t = useTranslations("cart")

  const addToCart: CartContextValue["addToCart"] = async (input) => {
    const updated = await addToCartAction(input)
    if (updated) setCart(updated)
    toast.success(t("addedToCart"))
  }

  const updateLineItem: CartContextValue["updateLineItem"] = async (input) => {
    const updated = await updateLineItemAction(input)
    if (updated) setCart(updated)
    toast.success(t("cartUpdated"))
  }

  const deleteLineItem: CartContextValue["deleteLineItem"] = async (lineId) => {
    const updated = await deleteLineItemAction(lineId)
    if (updated) setCart(updated)
    toast.success(t("itemRemoved"))
  }

  return (
    <CartContext.Provider value={{ cart, regionCurrencyCode, addToCart, updateLineItem, deleteLineItem }}>
      {children}
    </CartContext.Provider>
  )
}

const noopCart: CartContextValue = {
  cart: null,
  regionCurrencyCode: "USD",
  addToCart: async () => {},
  updateLineItem: async () => {},
  deleteLineItem: async () => {},
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext)
  // Outside CartProvider (e.g. checkout preview rendered in (checkout) route group):
  // return a no-op context so components that only read prices or render in
  // preview mode (no mutations) don't crash.
  return value ?? noopCart
}
